use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

declare_id!("Ref1exEscrow11111111111111111111111111111111");

const FEE_BPS: u64 = 1500;
const BPS_DENOMINATOR: u64 = 10_000;

#[program]
pub mod reflex_pvp_escrow {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, server_authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.server_authority = server_authority;
        config.fee_bps = FEE_BPS;
        config.fee_vault = ctx.accounts.fee_vault.key();
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn create_match(ctx: Context<CreateMatch>, stake: u64, join_expiry_secs: i64) -> Result<()> {
        require!(stake > 0, EscrowError::InvalidStake);

        let now = Clock::get()?.unix_timestamp;
        let game_match = &mut ctx.accounts.game_match;
        game_match.player_a = ctx.accounts.player_a.key();
        game_match.player_b = Pubkey::default();
        game_match.stake = stake;
        game_match.state = MatchState::WaitingForB;
        game_match.created_at = now;
        game_match.join_expiry_ts = now.saturating_add(join_expiry_secs);
        game_match.settle_deadline_ts = 0;
        game_match.vault_bump = ctx.bumps.vault;
        game_match.bump = 0;

        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.player_a.key(),
            &ctx.accounts.vault.key(),
            stake,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.player_a.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn join_match(ctx: Context<JoinMatch>, settle_deadline_secs: i64) -> Result<()> {
        let game_match = &mut ctx.accounts.game_match;
        require!(game_match.state == MatchState::WaitingForB, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp <= game_match.join_expiry_ts, EscrowError::JoinExpired);

        game_match.player_b = ctx.accounts.player_b.key();
        game_match.state = MatchState::Active;
        game_match.settle_deadline_ts = Clock::get()?.unix_timestamp.saturating_add(settle_deadline_secs);

        let transfer_ix = system_instruction::transfer(
            &ctx.accounts.player_b.key(),
            &ctx.accounts.vault.key(),
            game_match.stake,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.player_b.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn settle(ctx: Context<Settle>, winner_pubkey: Pubkey) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(ctx.accounts.server_authority.key() == config.server_authority, EscrowError::Unauthorized);

        let game_match = &mut ctx.accounts.game_match;
        require!(game_match.state == MatchState::Active, EscrowError::InvalidState);
        require!(winner_pubkey == game_match.player_a || winner_pubkey == game_match.player_b, EscrowError::InvalidWinner);

        let total_pot = game_match.stake.checked_mul(2).ok_or(EscrowError::MathOverflow)?;
        let fee = total_pot.checked_mul(config.fee_bps).ok_or(EscrowError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR).ok_or(EscrowError::MathOverflow)?;
        let payout = total_pot.checked_sub(fee).ok_or(EscrowError::MathOverflow)?;

        transfer_from_vault(
            &ctx.accounts.game_match,
            &ctx.accounts.vault,
            &ctx.accounts.fee_vault.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            fee,
        )?;

        let winner_info = if winner_pubkey == game_match.player_a {
            &ctx.accounts.player_a
        } else {
            &ctx.accounts.player_b
        };

        transfer_from_vault(
            &ctx.accounts.game_match,
            &ctx.accounts.vault,
            &winner_info.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            payout,
        )?;

        game_match.state = MatchState::Settled;
        Ok(())
    }

    pub fn cancel_unjoined(ctx: Context<CancelUnjoined>) -> Result<()> {
        let game_match = &mut ctx.accounts.game_match;
        require!(game_match.state == MatchState::WaitingForB, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp > game_match.join_expiry_ts, EscrowError::JoinNotExpired);

        transfer_from_vault(
            &ctx.accounts.game_match,
            &ctx.accounts.vault,
            &ctx.accounts.player_a.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            game_match.stake,
        )?;

        game_match.state = MatchState::Cancelled;
        Ok(())
    }

    pub fn timeout_refund(ctx: Context<TimeoutRefund>) -> Result<()> {
        let game_match = &mut ctx.accounts.game_match;
        require!(game_match.state == MatchState::Active, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp > game_match.settle_deadline_ts, EscrowError::SettlementDeadlineNotReached);

        transfer_from_vault(
            &ctx.accounts.game_match,
            &ctx.accounts.vault,
            &ctx.accounts.player_a.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            game_match.stake,
        )?;
        transfer_from_vault(
            &ctx.accounts.game_match,
            &ctx.accounts.vault,
            &ctx.accounts.player_b.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            game_match.stake,
        )?;

        game_match.state = MatchState::Refunded;
        Ok(())
    }
}

fn transfer_from_vault<'info>(
    game_match: &Account<'info, Match>,
    vault: &AccountInfo<'info>,
    destination: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    lamports: u64,
) -> Result<()> {
    let seeds = &[b"vault", game_match.key().as_ref(), &[game_match.vault_bump]];
    let signer = &[&seeds[..]];
    invoke_signed(
        &system_instruction::transfer(vault.key, destination.key, lamports),
        &[vault.clone(), destination.clone(), system_program.clone()],
        signer,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    /// CHECK: fixed fee destination account managed by DAO policy.
    pub fee_vault: UncheckedAccount<'info>,
    #[account(init, payer = admin, space = 8 + Config::INIT_SPACE, seeds=[b"config"], bump)]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMatch<'info> {
    #[account(mut)]
    pub player_a: Signer<'info>,
    #[account(seeds=[b"config"], bump=config.bump)]
    pub config: Account<'info, Config>,
    #[account(init, payer=player_a, space=8 + Match::INIT_SPACE)]
    pub game_match: Account<'info, Match>,
    #[account(init, payer=player_a, space=8, seeds=[b"vault", game_match.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub player_b: Signer<'info>,
    #[account(mut)]
    pub game_match: Account<'info, Match>,
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    pub server_authority: Signer<'info>,
    #[account(seeds=[b"config"], bump=config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub game_match: Account<'info, Match>,
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK: validated to be playerA
    #[account(mut, address=game_match.player_a)]
    pub player_a: UncheckedAccount<'info>,
    /// CHECK: validated to be playerB
    #[account(mut, address=game_match.player_b)]
    pub player_b: UncheckedAccount<'info>,
    /// CHECK: validated against config fee vault.
    #[account(mut, address=config.fee_vault)]
    pub fee_vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelUnjoined<'info> {
    #[account(mut, address=game_match.player_a)]
    pub player_a: Signer<'info>,
    #[account(mut)]
    pub game_match: Account<'info, Match>,
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TimeoutRefund<'info> {
    #[account(mut)]
    pub game_match: Account<'info, Match>,
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: SystemAccount<'info>,
    /// CHECK:
    #[account(mut, address=game_match.player_a)]
    pub player_a: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut, address=game_match.player_b)]
    pub player_b: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub server_authority: Pubkey,
    pub fee_bps: u64,
    pub fee_vault: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Match {
    pub player_a: Pubkey,
    pub player_b: Pubkey,
    pub stake: u64,
    pub state: MatchState,
    pub created_at: i64,
    pub join_expiry_ts: i64,
    pub settle_deadline_ts: i64,
    pub vault_bump: u8,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum MatchState {
    WaitingForB,
    Active,
    Settled,
    Refunded,
    Cancelled,
}

#[error_code]
pub enum EscrowError {
    #[msg("Only server authority may settle")]
    Unauthorized,
    #[msg("Invalid state transition")]
    InvalidState,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Stake must be positive")]
    InvalidStake,
    #[msg("Winner must be player A or B")]
    InvalidWinner,
    #[msg("Join window expired")]
    JoinExpired,
    #[msg("Join window not expired")]
    JoinNotExpired,
    #[msg("Settlement deadline not reached")]
    SettlementDeadlineNotReached,
}

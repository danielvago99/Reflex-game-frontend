use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

declare_id!("GMq3D9QQ8LxjcftXMnQUmffRoiCfczbuUoASaS7pCkp7");

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

        if ctx.accounts.vault.lamports() == 0 {
            let rent_lamports = Rent::get()?.minimum_balance(0);
            let match_key = ctx.accounts.game_match.key();
            let vault_seeds: &[&[u8]] = &[b"vault", match_key.as_ref(), &[ctx.bumps.vault]];
            invoke_signed(
                &system_instruction::create_account(
                    &ctx.accounts.player_a.key(),
                    &ctx.accounts.vault.key(),
                    rent_lamports,
                    0,
                    &crate::ID,
                ),
                &[
                    ctx.accounts.player_a.to_account_info(),
                    ctx.accounts.vault.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
                &[vault_seeds],
            )?;
        }

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

        let game_match = &ctx.accounts.game_match;
        require!(game_match.state == MatchState::Active, EscrowError::InvalidState);
        require!(winner_pubkey == game_match.player_a || winner_pubkey == game_match.player_b, EscrowError::InvalidWinner);

        let match_key = game_match.key();
        let vault_bump = game_match.vault_bump;
        let player_a = game_match.player_a;
        let player_b = game_match.player_b;

        let total_pot = game_match.stake.checked_mul(2).ok_or(EscrowError::MathOverflow)?;
        let fee = total_pot
            .checked_mul(config.fee_bps)
            .ok_or(EscrowError::MathOverflow)?
            .checked_div(BPS_DENOMINATOR)
            .ok_or(EscrowError::MathOverflow)?;
        let winner_payout = total_pot.checked_sub(fee).ok_or(EscrowError::MathOverflow)?;

        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &ctx.accounts.fee_vault.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            fee,
        )?;

        let winner_info = if winner_pubkey == player_a {
            &ctx.accounts.player_a
        } else {
            require!(winner_pubkey == player_b, EscrowError::InvalidWinner);
            &ctx.accounts.player_b
        };

        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &winner_info.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            winner_payout,
        )?;

        let rent_refund = ctx.accounts.vault.lamports();
        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &ctx.accounts.player_a.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            rent_refund,
        )?;

        let game_match = &mut ctx.accounts.game_match;
        game_match.state = MatchState::Settled;
        Ok(())
    }

    pub fn cancel_unjoined(ctx: Context<CancelUnjoined>) -> Result<()> {
        let game_match = &ctx.accounts.game_match;
        require!(game_match.state == MatchState::WaitingForB, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp > game_match.join_expiry_ts, EscrowError::JoinNotExpired);

        let total_refund = ctx.accounts.vault.lamports();
        let vault_bump = game_match.vault_bump;
        let match_key = game_match.key();

        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &ctx.accounts.player_a.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            total_refund,
        )?;

        let game_match = &mut ctx.accounts.game_match;
        game_match.state = MatchState::Cancelled;
        Ok(())
    }

    pub fn cancel_active_match(ctx: Context<CancelActiveMatch>) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.server_authority.key() == config.server_authority,
            EscrowError::Unauthorized
        );

        let game_match = &ctx.accounts.game_match;
        let vault_bump = game_match.vault_bump;
        let match_key = game_match.key();

        match game_match.state {
            MatchState::WaitingForB => {
                let total_refund = ctx.accounts.vault.lamports();
                transfer_from_vault(
                    &match_key,
                    vault_bump,
                    &ctx.accounts.vault,
                    &ctx.accounts.player_a.to_account_info(),
                    &ctx.accounts.system_program.to_account_info(),
                    total_refund,
                )?;
            }
            MatchState::Active => {
                require!(
                    ctx.accounts.player_b.key() == game_match.player_b,
                    EscrowError::InvalidPlayerB
                );

                let stake = game_match.stake;
                transfer_from_vault(
                    &match_key,
                    vault_bump,
                    &ctx.accounts.vault,
                    &ctx.accounts.player_b.to_account_info(),
                    &ctx.accounts.system_program.to_account_info(),
                    stake,
                )?;

                let remaining = ctx.accounts.vault.lamports();
                transfer_from_vault(
                    &match_key,
                    vault_bump,
                    &ctx.accounts.vault,
                    &ctx.accounts.player_a.to_account_info(),
                    &ctx.accounts.system_program.to_account_info(),
                    remaining,
                )?;
            }
            _ => return err!(EscrowError::InvalidState),
        }

        let game_match = &mut ctx.accounts.game_match;
        game_match.state = MatchState::Cancelled;
        Ok(())
    }

    pub fn timeout_refund(ctx: Context<TimeoutRefund>) -> Result<()> {
        let game_match = &ctx.accounts.game_match;
        require!(game_match.state == MatchState::Active, EscrowError::InvalidState);
        require!(Clock::get()?.unix_timestamp > game_match.settle_deadline_ts, EscrowError::SettlementDeadlineNotReached);

        let stake = game_match.stake;
        let vault_bump = game_match.vault_bump;
        let match_key = game_match.key();

        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &ctx.accounts.player_a.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            stake,
        )?;
        transfer_from_vault(
            &match_key,
            vault_bump,
            &ctx.accounts.vault,
            &ctx.accounts.player_b.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            stake,
        )?;

        let game_match = &mut ctx.accounts.game_match;
        game_match.state = MatchState::Refunded;
        Ok(())
    }
}

fn transfer_from_vault<'info>(
    _match_key: &Pubkey,
    _vault_bump: u8,
    vault: &AccountInfo<'info>,
    destination: &AccountInfo<'info>,
    _system_program: &AccountInfo<'info>,
    lamports: u64,
) -> Result<()> {
    // Since the vault account is owned by the program (assigned in create_match),
    // we must manually manipulate the lamports instead of using the System Program.

    // Decrease vault balance
    **vault.try_borrow_mut_lamports()? = vault
        .lamports()
        .checked_sub(lamports)
        .ok_or(EscrowError::MathOverflow)?;

    // Increase destination balance
    **destination.try_borrow_mut_lamports()? = destination
        .lamports()
        .checked_add(lamports)
        .ok_or(EscrowError::MathOverflow)?;

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
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub player_b: Signer<'info>,
    #[account(mut)]
    pub game_match: Account<'info, Match>,
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    pub server_authority: Signer<'info>,
    #[account(seeds=[b"config"], bump=config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, close=player_a)]
    pub game_match: Account<'info, Match>,
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: UncheckedAccount<'info>,
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
    #[account(mut, close=player_a)]
    pub game_match: Account<'info, Match>,
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TimeoutRefund<'info> {
    #[account(mut, close=player_a)]
    pub game_match: Account<'info, Match>,
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut, address=game_match.player_a)]
    pub player_a: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut, address=game_match.player_b)]
    pub player_b: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelActiveMatch<'info> {
    pub server_authority: Signer<'info>,
    #[account(seeds=[b"config"], bump=config.bump)]
    pub config: Account<'info, Config>,
    #[account(mut, close=player_a)]
    pub game_match: Account<'info, Match>,
    /// CHECK: PDA vault used to hold player stakes.
    #[account(mut, seeds=[b"vault", game_match.key().as_ref()], bump=game_match.vault_bump)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: validated to be playerA.
    #[account(mut, address=game_match.player_a)]
    pub player_a: UncheckedAccount<'info>,
    /// CHECK: validated in instruction for active matches.
    #[account(mut)]
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
    #[msg("Provided player B account does not match match state")]
    InvalidPlayerB,
}

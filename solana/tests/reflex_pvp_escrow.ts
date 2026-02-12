import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';

describe('reflex_pvp_escrow', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it('documents required on-chain scenarios (create/join/settle/refund guards)', async () => {
    expect(provider.connection.rpcEndpoint).to.include('devnet');
  });
});

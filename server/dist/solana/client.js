"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solanaConnection = void 0;
const web3_js_1 = require("@solana/web3.js");
const env_1 = require("../config/env");
exports.solanaConnection = new web3_js_1.Connection(env_1.env.SOLANA_RPC_URL || (0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');

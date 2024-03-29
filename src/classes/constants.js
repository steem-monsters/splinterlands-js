const Constants = Object.freeze({
    TRANSACTION_QTY_MINUS_BRIDGE_FEE: 0.995,
    BRIDGE_FEE: 0.005,
	EDITIONS: { 
		ARRAY: ['Alpha', 'Beta', 'Promo', 'Reward', 'Untamed', 'Dice', 'Gladius', 'Chaos', 'Rift', 'Nightmare', 'Soulbound'],
		ALPHA:        { ID: 0, TEXT: 'Alpha'  },
		BETA:         { ID: 1, TEXT: 'Beta'   },
		PROMO:        { ID: 2, TEXT: 'Promo'  },
		REWARD:       { ID: 3, TEXT: 'Reward' },
		UNTAMED:      { ID: 4, TEXT: 'Untamed'},
		DICE:         { ID: 5, TEXT: 'Dice'   },
		GLADIUS:      { ID: 6, TEXT: 'Gladius'},
		CHAOS:        { ID: 7, TEXT: 'Chaos'  },
		RIFT: 		  { ID: 8, TEXT: 'Rift' },
		NIGHTMARE: 	  { ID: 9, TEXT: 'Nightmare' },
		SOULBOUND: 	  { ID: 10, TEXT: 'Soulbound' },
		REBELLION:    { ID: 12, TEXT: 'Rebellion' },
	},
	ONFIDO_STATUS: {
		CLEAR:    { TEXT: 'CLEAR',    CODE: 'verification_cleared'    },
		CONSIDER: { TEXT: 'CONSIDER', CODE: 'verification_consider' },
		PENDING:  { TEXT: 'PENDING',  CODE: 'verification_pending'  },
		BLOCKED:  { TEXT: 'BLOCKED',  CODE: 'verification_blocked'  },
		NEEDED:   { TEXT: 'NEEDED',   CODE: 'verification_needed'   },
	},
	SPLINTERFEST_PASS_TYPE: {
		VIP: 'splinterfest2022_vip',
		GENERAL: 'splinterfest2022_general',
	},
	RUNI_AVATAR_ID_OFFSET: 1000,
	FIRST_RUNI_NUMBER: 1,
	LAST_RUNI_NUMBER: 3521,
});

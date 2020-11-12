
import {mockSignToken} from "redcrypto/dist/curries/mock-sign-token.js"
import {mockVerifyToken} from "redcrypto/dist/curries/mock-verify-token.js"

import {mockVerifyGoogleToken} from "../features/core/mock-google-tokens.js"
import {AppPayload, AuthTokens, CoreApi, TriggerAccountPopup} from "../features/core/core-types.js"

import {getRando} from "../toolbox/get-rando.js"
import {SimpleStorage} from "../toolbox/json-storage.js"
import {dbbyMemory} from "../toolbox/dbby/dbby-memory.js"

import {Tables} from "./assembly-types.js"
import {expiryGraceTime} from "./constants.js"
import {assembleBackend} from "./assemble-backend.js"
import {assembleFrontend} from "./assemble-frontend.js"
import {mockPlatformConfig} from "./mock-platform-config.js"

export async function mockWholeSystem({storage, generateNickname}: {
			storage: SimpleStorage
			generateNickname: () => string
		}) {

	// prerequisites and configurations

	const rando = await getRando()
	const config = mockPlatformConfig({rando})
	const signToken = mockSignToken()
	const verifyToken = mockVerifyToken()
	const verifyGoogleToken = mockVerifyGoogleToken
	const tables: Tables = {
		core: {
			account: dbbyMemory(),
			profile: dbbyMemory(),
			userRole: dbbyMemory(),
			rolePrivilege: dbbyMemory(),
			accountViaGoogle: dbbyMemory(),
			accountViaPasskey: dbbyMemory(),
		},
	}

	// backend assembly

	const backend = await assembleBackend({
		rando,
		config,
		tables,
		storage,
		signToken,
		verifyToken,
		generateNickname,
		verifyGoogleToken,
	})

	// mock bridge connecting backend and frontend

	let triggerAccountPopupAction: TriggerAccountPopup = async() => {
		throw new Error("no mock login set")
	}

	function mockNextLogin(
				auth: (authTopic: CoreApi["authTopic"]) => Promise<AuthTokens>
			) {
		triggerAccountPopupAction = async() =>
			auth(backend.coreApi.authTopic)
	}

	// frontend assembly

	const frontend = await assembleFrontend({
		backend,
		expiryGraceTime,
		triggerAccountPopup: async() => triggerAccountPopupAction(),
	})

	// return everything including internals for testing and debugging

	async function signAppToken(payload: AppPayload) {
		return signToken({payload, lifespan: config.tokens.lifespans.app})
	}

	return {config, backend, frontend, tables, mockNextLogin, signAppToken}
}

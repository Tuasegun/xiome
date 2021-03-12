
import {Rando} from "../../../../toolbox/get-rando.js"
import {AuthTables} from "../../tables/types/auth-tables.js"
import {find} from "../../../../toolbox/dbby/dbby-helpers.js"
import {assertEmailAccount} from "../login/assert-email-account.js"
import {adminRoleId} from "../../permissions/standard/build/ids/hard-role-ids.js"
import {PlatformConfig} from "../../../../assembly/backend/types/platform-config.js"

export async function appointAdmin({email, tablesForApp, rando, config}: {
			email: string
			tablesForApp: AuthTables
		} & {
			rando: Rando
			config: PlatformConfig
		}) {
	const {userId: adminUserId} = await assertEmailAccount({
		rando,
		email,
		config,
		tables: tablesForApp,
	})
	await tablesForApp.permissions.userHasRole.assert({
		...find({userId: adminUserId, roleId: adminRoleId}),
		make: async () => ({
			userId: adminUserId,
			roleId: adminRoleId,
			hard: false,
			public: true,
			timeframeEnd: undefined,
			timeframeStart: undefined,
		})
	})
}

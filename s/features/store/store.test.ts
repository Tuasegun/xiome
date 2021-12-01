
import {Suite, expect} from "cynic"
import {ops} from "../../framework/ops.js"
import {storePrivileges} from "./store-privileges.js"
import {storeTestSetup} from "./testing/store-test-setup.js"
import {setupSimpleStoreClient} from "./testing/store-quick-setup.js"

export default <Suite>{
	"stripe connect": {
		async "merchant can connect a stripe account"() {
			const {storeModel, ...client} = await setupSimpleStoreClient(
				"connect stripe account"
			)
			const getConnectDetails = () => ops.value(
				storeModel.state.connectDetailsOp
			)
			expect(getConnectDetails()).not.ok()
			await storeModel.connectSubmodel.connectStripeAccount()
			expect(getConnectDetails()).ok()
			await client.setLoggedOut()
			expect(getConnectDetails()).not.ok()
		},
		async "plebeian cannot connect a stripe account"() {
			const {storeModel} = await setupSimpleStoreClient()
			await expect(
				async() => storeModel.connectSubmodel.connectStripeAccount()
			).throws()
		},
		async "a different merchant can see the connect details"() {
			const {makeClient} = await storeTestSetup()
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges(
					storePrivileges["connect stripe account"]
				)
				await client.storeModel.connectSubmodel.connectStripeAccount()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).ok()
			}
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges(
					storePrivileges["connect stripe account"]
				)
				await client.storeModel.connectSubmodel.activate()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).ok()
			}
		},
		async "plebeian cannot see connect details or status"() {
			const {makeClient} = await storeTestSetup()
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges(
					storePrivileges["connect stripe account"]
				)
				await client.storeModel.connectSubmodel.connectStripeAccount()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).ok()
			}
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges()
				await client.storeModel.connectSubmodel.activate()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).not.defined()
				expect(ops.value(client.storeModel.state.connectStatusOp)).not.defined()
			}
		},
		async "clerk can see the connect status, but not the details"() {
			const {makeClient} = await storeTestSetup()
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges(
					storePrivileges["connect stripe account"]
				)
				await client.storeModel.connectSubmodel.connectStripeAccount()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).ok()
			}
			{
				const client = await makeClient()
				await client.setAccessWithPrivileges(storePrivileges["manage store"])
				await client.storeModel.connectSubmodel.activate()
				expect(ops.value(client.storeModel.state.connectStatusOp)).defined()
				expect(ops.value(client.storeModel.state.connectDetailsOp)).not.defined()
			}
		},
	},
}

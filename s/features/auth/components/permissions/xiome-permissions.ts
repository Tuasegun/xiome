
import styles from "./xiome-permissions.css.js"
import lockSvg from "../../../../framework/icons/lock.svg.js"
import {AuthModel} from "../../models/types/auth/auth-model.js"
import {makePermissionsModel} from "../../models/permissions-model.js"
import {renderOp} from "../../../../framework/op-rendering/render-op.js"
import {RoleDisplay} from "../../topics/permissions/types/role-display.js"
import {ModalSystem} from "../../../../assembly/frontend/modal/types/modal-system.js"
import {PermissionsDisplay} from "../../topics/permissions/types/permissions-display.js"
import {roleLabelValidator} from "../../topics/permissions/validators/role-label-validator.js"
import {mixinStyles, html, property, Component3WithShare} from "../../../../framework/component2/component2.js"

@mixinStyles(styles)
export class XiomePermissions extends Component3WithShare<{
		modals: ModalSystem
		authModel: AuthModel
		permissionsModel: ReturnType<typeof makePermissionsModel>
	}> {

	init() {
		this.share.permissionsModel.initialize()
	}

	@property()
	private roleSelected: RoleDisplay

	private clickRole = (role: RoleDisplay) => () => {
		this.roleSelected = role
	}

	private getAssignedPrivileges(permissions: PermissionsDisplay) {
		const {roleSelected} = this
		if (!roleSelected) return []

		const assignedPrivilegeIds = permissions.rolesHavePrivileges
			.filter(({roleId}) => roleId === roleSelected.roleId)
			.map(({privilegeId}) => privilegeId)

		return permissions.privileges
			.filter(({privilegeId}) =>
				assignedPrivilegeIds.includes(privilegeId))
			.map(privilege => {
				const {active, immutable} = permissions.rolesHavePrivileges.find(
					rp => rp.roleId === roleSelected.roleId &&
						rp.privilegeId === privilege.privilegeId
				)
				return {...privilege, active, immutable}
			})
	}

	private clickNewRole = async() => {
		const {modals, permissionsModel} = this.share
		const result = await modals.prompt<string>({
			title: "enter a name for your new custom role",
			input: {
				label: "role name",
				validator: roleLabelValidator,
			},
		})
		if (result)
			await permissionsModel.createRole({label: result.value})
	}

	private clickAvailablePrivilege = (privilegeId: string) => async() => {
		const {roleSelected} = this
		if (roleSelected)
			await this.share.permissionsModel.assignPrivilege({
				privilegeId,
				roleId: roleSelected.roleId,
			})
	}

	private clickAssignedPrivilege = (privilegeId: string) => async() => {
		const {roleSelected} = this
		if (roleSelected)
			await this.share.permissionsModel.unassignPrivilege({
				privilegeId,
				roleId: roleSelected.roleId,
			})
	}

	private renderPrivilege({
			privilegeId,
			label,
			hard,
			immutable,
			onPrivilegeClick,
		}: {
			privilegeId: string
			label: string
			hard: boolean
			immutable: boolean
			onPrivilegeClick: () => void
		}) {
		return html`
			<xio-button
				title="${privilegeId}"
				?disabled=${immutable}
				?data-hard=${hard}
				?data-soft=${!hard}
				?data-immutable=${immutable}
				@press=${onPrivilegeClick}>
					<div>
						${immutable
							? html`<div class=icon>${lockSvg}</div>`
							: null}
						${label}
					</div>
			</xio-button>
		`
	}

	private renderPermissions(permissions: PermissionsDisplay) {
		console.log(permissions)
		const assignedPrivileges = this.getAssignedPrivileges(permissions)
		const activePrivileges = assignedPrivileges.filter(p => p.active)
		const availablePrivileges = this.roleSelected
			? [
				...permissions.privileges
					.filter(privilege => {
						const assigned = assignedPrivileges
							.find(priv => priv.privilegeId === privilege.privilegeId)
						return !assigned
					})
					.map(privilege => ({...privilege, immutable: false})),
				...assignedPrivileges
					.filter(privilege => !privilege.active)
			]
			: []
		return html`
			<div class=container>
				<div class=roles>
					<p>roles</p>
					<div part=plate>
						${permissions.roles.map(role => html`
							<xio-button
								title="${role.roleId}"
								?data-selected=${
									this.roleSelected &&
									role.roleId === this.roleSelected.roleId
								}
								?data-hard=${role.hard}
								?disabled=${
									this.roleSelected &&
									role.roleId === this.roleSelected.roleId
								}
								@click=${this.clickRole(role)}>
									${role.label}
							</xio-button>
						`)}
					</div>
					<!-- <div part=plate class=buttonbar>
						<xio-button class=buttonbar @press=${this.clickNewRole}>
							new role
						</xio-button>
					</div> -->
				</div>

				<div class=assigned>
					<p>
						privileges assigned
						${this.roleSelected
							? ` to "${this.roleSelected.label}"`
							: null
						}
					</p>
					<div part=plate>
						${activePrivileges.map(privilege => this.renderPrivilege({
								...privilege,
								onPrivilegeClick:
									this.clickAssignedPrivilege(privilege.privilegeId)
							}))}
					</div>
				</div>

				<div class=available>
					<p>privileges available</p>
					<div part=plate>
						${availablePrivileges.map(privilege => this.renderPrivilege({
							...privilege,
							onPrivilegeClick: this.clickAvailablePrivilege(privilege.privilegeId),
						}))}
					</div>
				</div>
			</div>
		`
	}

	render() {
		const {permissionsModel} = this.share
		const {getUserCanCustomizePermissions, getState} = permissionsModel
		const state = getState()
		return getUserCanCustomizePermissions()
			? renderOp(
				state.permissionsDisplay,
				this.renderPermissions.bind(this),
			)
			: html`
				<p>you are not privileged to customize permissions</p>
			`
	}
}

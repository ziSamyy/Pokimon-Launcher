/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict'

import { database, changePanel, addAccount, accountSelect } from '../utils.js'

const { Mojang } = require('minecraft-java-core')

class Login {
	static id = 'login'
	async init(config) {
		this.config = config
		this.database = await new database().init()
		this.getOnline()
	}

	getOnline() {
		console.log(`Initializing shakura Panel...`)
		this.loginShakura()
		document.querySelector('.cancel-login').addEventListener('click', () => {
			document.querySelector('.cancel-login').style.display = 'none'
			changePanel('settings')
		})
	}

	async loginShakura() {
		let mailInput = document.querySelector('.Mail')
		let passwordInput = document.querySelector('.Password')
		let infoLogin = document.querySelector('.info-login')
		let loginBtn = document.querySelector('.login-btn')

		Mojang.ChangeAuthApi(`https://account.sakuralivemc.com/api/yggdrasil/authserver`)

		loginBtn.addEventListener('click', async () => {
			loginBtn.disabled = true
			mailInput.disabled = true
			passwordInput.disabled = true
			infoLogin.innerHTML = 'Conectando...'

			if (mailInput.value == '') {
				infoLogin.innerHTML = 'Ingrese su dirección de correo electrónico o nombre de usuario'
				loginBtn.disabled = false
				mailInput.disabled = false
				passwordInput.disabled = false
				return
			}

			if (passwordInput.value == '') {
				infoLogin.innerHTML = 'Ingrese su contraseña'
				loginBtn.disabled = false
				mailInput.disabled = false
				passwordInput.disabled = false
				return
			}

			let account_connect = await Mojang.login(mailInput.value, passwordInput.value)

			if (account_connect == null || account_connect.error) {
				loginBtn.disabled = false
				mailInput.disabled = false
				passwordInput.disabled = false
				infoLogin.innerHTML = 'Dirección de correo electrónico o contraseña inválidas'
				return
			}

			let account = {
				access_token: account_connect.access_token,
				client_token: account_connect.client_token,
				uuid: account_connect.uuid,
				name: account_connect.name,
				user_properties: account_connect.user_properties,
				meta: {
					type: account_connect.meta.type,
					offline: account_connect.meta.offline,
				},
			}

			this.database.add(account, 'accounts')
			this.database.update({ uuid: '1234', selected: account.uuid }, 'accounts-selected')

			addAccount(account)
			accountSelect(account.uuid)
			changePanel('home')

			mailInput.value = ''
			loginBtn.disabled = false
			mailInput.disabled = false
			passwordInput.disabled = false
			loginBtn.style.display = 'block'
			infoLogin.innerHTML = '&nbsp;'
		})
	}
}

export default Login

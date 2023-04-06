/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict'
const { ipcRenderer } = require('electron')
import { config } from './utils.js'

let dev = process.env.NODE_ENV === 'dev'

class Splash {
	constructor() {
		this.splash = document.querySelector('.splash')
		this.splashMessage = document.querySelector('.splash-message')
		this.splashAuthor = document.querySelector('.splash-author')
		this.message = document.querySelector('.message')
		this.progress = document.querySelector('progress')
		document.addEventListener('DOMContentLoaded', () => this.startAnimation())
	}

	async startAnimation() {
		let splashes = [
			{ message: '🌸 Sakura ...', author: 'lex05' },
			{ message: 'Launcher creado con 🧡', author: 'lex05' },
			{ message: 'Disfruta ;)', author: 'lex05' },
			{ message: 'Bienvenid@s', author: 'lemon' },
			{ message: 'recuerda tomar awita con frecuencia', author: 'miki' },
			{ message: 'No olvides decirle a tu mamá que la quieres mucho', author: 'miki' },
			{ message: 'Recuerda alimentarte', author: 'lemon' },
			{ message: 'Esta bien no estar bien a veces', author: 'miki' },
			{ message: 'Puedes llorar si asi lo deseas', author: 'lemon' },
			{
				message:
					'Aprender a gestionar correctamente tus emociones es tu responsabilidad, estaras bien',
				author: 'miki',
			},
			{ message: 'La vida tiene el color que tu deseas pintar', author: 'lemon' },
			{
				message: 'Recuerda que no puedes controlar tus emociones',
				author: 'miki',
			},
			{
				message: 'Recuerda no guardar tus emociones bajo llave',
				author: 'miki',
			},
		]
		let splash = splashes[Math.floor(Math.random() * splashes.length)]
		this.splashMessage.textContent = splash.message
		this.splashAuthor.children[0].textContent = '@' + splash.author
		await sleep(100)
		document.querySelector('#splash').style.display = 'block'
		await sleep(500)
		this.splash.classList.add('opacity')
		await sleep(500)
		this.splash.classList.add('translate')
		this.splashMessage.classList.add('opacity')
		this.splashAuthor.classList.add('opacity')
		this.message.classList.add('opacity')
		await sleep(1000)
		this.checkUpdate()
	}

	async checkUpdate() {
		if (dev) return this.startLauncher()
		this.setStatus(`Comprobando actualizaciones...`)

		ipcRenderer.invoke('update-app').then((err) => {
			if (err.error) {
				let error = err.message
				this.shutdown(`error al buscar actualizaciones :<br>${error}`)
			}
		})

		ipcRenderer.on('updateAvailable', () => {
			this.setStatus(`¡Actualización disponible!`)
			this.toggleProgress()
			ipcRenderer.send('start-update')
		})

		ipcRenderer.on('download-progress', (event, progress) => {
			this.setProgress(progress.transferred, progress.total)
		})

		ipcRenderer.on('update-not-available', () => {
			this.maintenanceCheck()
		})
	}

	async maintenanceCheck() {
		config
			.GetConfig()
			.then((res) => {
				if (res.maintenance) return this.shutdown(res.maintenance_message)
				this.startLauncher()
			})
			.catch((e) => {
				console.error(e)
				return this.shutdown(
					'No se detectó una conexión a internet,<br>Inténtalo de nuevo más tarde.'
				)
			})
	}

	startLauncher() {
		this.setStatus(`Iniciando launcher`)
		ipcRenderer.send('main-window-open')
		ipcRenderer.send('update-window-close')
	}

	shutdown(text) {
		this.setStatus(`${text}<br>Cerrando en 5s`)
		let i = 4
		setInterval(() => {
			this.setStatus(`${text}<br>Cerrando en ${i--}s`)
			if (i < 0) ipcRenderer.send('update-window-close')
		}, 1000)
	}

	setStatus(text) {
		this.message.innerHTML = text
	}

	toggleProgress() {
		if (this.progress.classList.toggle('show')) this.setProgress(0, 1)
	}

	setProgress(value, max) {
		this.progress.value = value
		this.progress.max = max
	}
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms))
}

document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey && e.shiftKey && e.keyCode == 73) || e.keyCode == 123) {
		ipcRenderer.send('update-window-dev-tools')
	}
})
new Splash()

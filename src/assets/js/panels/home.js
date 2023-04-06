/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict'

import { logger, database, changePanel } from '../utils.js'

const { Launch, Status } = require('minecraft-java-core')
const { ipcRenderer } = require('electron')
const launch = new Launch()
const pkg = require('../package.json')
const path = require('path')

const dataDirectory =
	process.env.APPDATA ||
	(process.platform == 'darwin'
		? `${process.env.HOME}/Library/Application Support`
		: process.env.HOME)

class Home {
	static id = 'home'
	async init(config, news) {
		this.config = config
		this.news = await news
		this.database = await new database().init()
		this.initNews()
		this.initLaunch()
		this.initStatusServer()
		this.initBtn()
	}

	async initNews() {
		let news = document.querySelector('.news-list')
		if (this.news) {
			if (!this.news.length) {
				let blockNews = document.createElement('div')
				blockNews.classList.add('news-block', 'opacity-1')
				blockNews.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title">No hay noticias disponibles.</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>Se mostrarán aquí todas las noticias relacionadas con el servidor.</p>
                        </div>
                    </div>`
				news.appendChild(blockNews)
			} else {
				for (let News of this.news) {
					let date = await this.getdate(News.publish_date)
					let blockNews = document.createElement('div')
					blockNews.classList.add('news-block')
					blockNews.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content.replace(/\n/g, '</br>')}</p>
                                <p class="news-author">Autor,<span> ${News.author}</span></p>
                            </div>
                        </div>`
					news.appendChild(blockNews)
				}
			}
		} else {
			let blockNews = document.createElement('div')
			blockNews.classList.add('news-block', 'opacity-1')
			blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title">Error.</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>No se pudo obtener información.</p>
                    </div>
                </div>`
			// news.appendChild(blockNews)
		}
	}

	async initLaunch() {
		document.querySelector('.play-btn').addEventListener('click', async () => {
			let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url
			let uuid = (await this.database.get('1234', 'accounts-selected')).value
			let account = (await this.database.get(uuid.selected, 'accounts')).value
			let ram = (await this.database.get('1234', 'ram')).value
			let Resolution = (await this.database.get('1234', 'screen')).value
			let launcherSettings = (await this.database.get('1234', 'launcher')).value

			let playBtn = document.querySelector('.play-btn')
			let info = document.querySelector('.text-download')
			let progressBar = document.querySelector('.progress-bar')

			if (Resolution.screen.width == '<auto>') {
				screen = false
			} else {
				screen = {
					width: Resolution.screen.width,
					height: Resolution.screen.height,
				}
			}

			let opts = {
				url:
					this.config.game_url === '' || this.config.game_url === undefined
						? `${urlpkg}/files`
						: this.config.game_url,
				authenticator: account,
				timeout: 10000,
				path: `${dataDirectory}/${
					process.platform == 'darwin'
						? this.config.dataDirectory
						: `.${this.config.dataDirectory}`
				}`,
				version: this.config.game_version,
				instance: 'sakura',
				detached: launcherSettings.launcher.close === 'close-all' ? false : true,
				downloadFileMultiple: 30,

				loader: {
					type: this.config.loader.type,
					build: this.config.loader.build,
					enable: this.config.loader.enable,
				},

				verify: this.config.verify,
				ignored: ['loader', ...this.config.ignored],

				java: true,

				JVM_ARGS: [
					`-javaagent:${path.join(
						process.cwd(),
						process.env.NODE_ENV === 'dev' ? 'src' : 'resources',
						'libraries',
						'java',
						'sakuraAuth.jar'
					)}=https://account.sakuralivemc.com/api/yggdrasil`,
					'-Dauthlibinjector.side=client',
					'-Dauthlibinjector.yggdrasil.prefetched=ewogICAgIm1ldGEiOiB7CiAgICAgICAgInNlcnZlck5hbWUiOiAiU2FrdXJhIiwKICAgICAgICAiaW1wbGVtZW50YXRpb25OYW1lIjogIllnZ2RyYXNpbCBBUEkgZm9yIEJsZXNzaW5nIFNraW4iLAogICAgICAgICJpbXBsZW1lbnRhdGlvblZlcnNpb24iOiAiNS4xLjUiLAogICAgICAgICJsaW5rcyI6IHsKICAgICAgICAgICAgImhvbWVwYWdlIjogImh0dHBzOi8vYWNjb3VudC5zYWt1cmFsaXZlbWMuY29tIiwKICAgICAgICAgICAgInJlZ2lzdGVyIjogImh0dHBzOi8vYWNjb3VudC5zYWt1cmFsaXZlbWMuY29tL2F1dGgvcmVnaXN0ZXIiCiAgICAgICAgfSwKICAgICAgICAiZmVhdHVyZS5ub25fZW1haWxfbG9naW4iOiB0cnVlCiAgICB9LAogICAgInNraW5Eb21haW5zIjogWwogICAgICAgICJhY2NvdW50LnNha3VyYWxpdmVtYy5jb20iCiAgICBdLAogICAgInNpZ25hdHVyZVB1YmxpY2tleSI6ICItLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxuTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUF0di9BRWVEam5WWUt5VVFzNmJVRlxuZXVJSUFmYUNQaHRaWEtvVVpUbVFGUmNac1I2UE5ab3lBcmJxVi9vOGRLWUp0SGhWYnNuTjMxRnJCRWpDWVNjZVxuQSthSXJibzNxMVJwWVYzT0FSUDhBWDQ3a0FBMkxRSGJtYjlmbzQ0UzNqVEUwdjJZNU5OUVJneDJ4TGw4bFBUaVxublY4Rm5Mbkl0a0syQ0o1QmlEbDk1b3cydFhVTjlCT0hDRTZHSUY2R1ViZXJGejhtRkZIT0o4T1VsV05sUk9Kb1xuK3pzTG1vQ3drNm9NVDVJb3UvdjUwT24xQUZ6Ri9GNmVwQ25SYVk1VjZpOThpVWllTGlSYnJ2cHZDaGtRNXE4K1xubTdXSjMrWS9CbHEzZTg5TndQay9WUzdjRCtaZDArNHlHdENWSnBicVRWZ0o2dklFTzhsUTROZFNNUjQ4QmE2cVxuN0x6aThZV0N2Ry95NWRLeDFYbUtDRHgzQzNnNGJKQkhqWlNXK09UUmlhcDJtNUJqcjJ2K3JGQTFudjBPRXJCbVxuRXllaUQ1UEYyb2hEbURVb1JvYmdyWFBCOVB0LzdzSW5zS0xCVVhJWkY2VWxZWU5EL0svTDNLMVpGSTZhMlJ6WlxuYS9MNFhGZThuS2YxWUxUOHV0UG03aUdSRGNhWVY0OVhiRC9maFVrV1dZa2VMNUsrY01iOTV1ZUwvK1FDOGhPL1xuWnhpSUxndG53SlBTaGlZRjNSL2lMVGsxMXN4VlZZa0dGNGFjWXkwSzFQWE9ENS9JbDJQaVg2a3YvT2lHclZRTFxua3VhemVzbzZjU1F0V0Z0MktLYVVCU1FiK0psTjIxNnUzR0lHUDI1YXZpVHZWUlpjR2hJd1lzTERuVVZ6NWpudFxueGFUMnRhYTE5c29OOW5POTlva1paZEVDQXdFQUFRPT1cbi0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLVxuIgp9',
				],

				memory: {
					min: `${ram.ramMin * 1024}M`,
					max: `${ram.ramMax * 1024}M`,
				},
			}

			playBtn.style.display = 'none'
			info.style.display = 'block'
			launch.Launch(opts)

			launch.on('extract', (extract) => {
				console.log(extract)
			})

			launch.on('progress', (progress, size) => {
				progressBar.style.display = 'block'
				document.querySelector('.text-download').innerHTML = `Descargando ${(
					(progress / size) *
					100
				).toFixed(0)}%`
				ipcRenderer.send('main-window-progress', { progress, size })
				progressBar.value = progress
				progressBar.max = size
			})

			launch.on('check', (progress, size) => {
				progressBar.style.display = 'block'
				document.querySelector('.text-download').innerHTML = `Verificando ${(
					(progress / size) *
					100
				).toFixed(0)}%`
				progressBar.value = progress
				progressBar.max = size
			})

			launch.on('estimated', (time) => {
				if (isNaN(time)) {
					document.querySelector('.text-download').innerHTML =
						'Error inesperado.\nReinicia el launcher'
					document.querySelector('.text-download').style.margin = '-35%'
					return
				}
				let hours = Math.floor(time / 3600)
				let minutes = Math.floor((time - hours * 3600) / 60)
				let seconds = Math.floor(time - hours * 3600 - minutes * 60)
				console.log(`${hours}h ${minutes}m ${seconds}s`)
			})

			launch.on('speed', (speed) => {
				if (speed == 0) return
				console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
			})

			launch.on('patch', (patch) => {
				console.log(patch)
				info.innerHTML = `Parcheando ..`
			})

			launch.on('data', (e) => {
				new logger('Minecraft', '#36b030')
				if (launcherSettings.launcher.close === 'close-launcher')
					ipcRenderer.send('main-window-hide')
				ipcRenderer.send('main-window-progress-reset')
				progressBar.style.display = 'none'
				info.innerHTML = `Iniciando...`
				console.log(e)
			})

			launch.on('close', (code) => {
				if (launcherSettings.launcher.close === 'close-launcher')
					ipcRenderer.send('main-window-show')
				progressBar.style.display = 'none'
				info.style.display = 'none'
				playBtn.style.display = 'block'
				info.innerHTML = `Verificando`
				new logger('Launcher', '#7289da')
				console.log('Close')
			})

			launch.on('error', (err) => {
				console.log(err)
				console.log('trying new Launch...')
				launch.Launch(opts)
			})
		})
	}

	async initStatusServer() {
		let nameServer = document.querySelector('.server-text .name')
		let serverMs = document.querySelector('.server-text .desc')
		let playersConnected = document.querySelector('.etat-text .text')
		let online = document.querySelector('.etat-text .online')
		let serverPing = await new Status(
			this.config.status.ip,
			this.config.status.port
		).getStatus()

		if (!serverPing.error) {
			nameServer.textContent = this.config.status.nameServer
			serverMs.innerHTML = `<span class="green">En línea</span> - ${serverPing.ms}ms`
			online.classList.toggle('off')
			playersConnected.textContent = serverPing.playersConnect
		} else if (serverPing.error) {
			nameServer.textContent = 'Servidor no disponible'
			serverMs.innerHTML = `<span class="red">Sin conexión</span>`
		}
	}

	initBtn() {
		document.querySelector('.settings-btn').addEventListener('click', () => {
			changePanel('settings')
		})
	}

	async getdate(e) {
		let date = new Date(e)
		let year = date.getFullYear()
		let month = date.getMonth() + 1
		let day = date.getDate()
		let allMonth = [
			'enero',
			'febrero',
			'marzo',
			'abril',
			'mayo',
			'junio',
			'julio',
			'agosto',
			'septiembre',
			'octubre',
			'noviembre',
			'diciembre',
		]
		return { year: year, month: allMonth[month - 1], day: day }
	}
}
export default Home

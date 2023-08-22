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
		// this.initNews()
		this.initLaunch()
		this.initStatusServer()
		this.initBtn()
	}

	// async initNews() {
	// 	let news = document.querySelector('.news-list')
	// 	if (this.news) {
	// 		if (!this.news.length) {
	// 			let blockNews = document.createElement('div')
	// 			blockNews.classList.add('news-block', 'opacity-1')
	// 			blockNews.innerHTML = `
	//                 <div class="news-header">
	//                     <div class="header-text">
	//                         <div class="title">No hay noticias disponibles.</div>
	//                     </div>
	//                 </div>
	//                 <div class="news-content">
	//                     <div class="bbWrapper">
	//                         <p>Se mostrarán aquí todas las noticias relacionadas con el servidor.</p>
	//                     </div>
	//                 </div>`
	// 			news.appendChild(blockNews)
	// 		} else {
	// 			for (let News of this.news) {
	// 				let date = await this.getdate(News.publish_date)
	// 				let blockNews = document.createElement('div')
	// 				blockNews.classList.add('news-block')
	// 				blockNews.innerHTML = `
	//                     <div class="news-header">
	//                         <div class="header-text">
	//                             <div class="title">${News.title}</div>
	//                         </div>
	//                         <div class="date">
	//                             <div class="day">${date.day}</div>
	//                             <div class="month">${date.month}</div>
	//                         </div>
	//                     </div>
	//                     <div class="news-content">
	//                         <div class="bbWrapper">
	//                             <p>${News.content.replace(/\n/g, '</br>')}</p>
	//                             <p class="news-author">Autor,<span> ${News.author}</span></p>
	//                         </div>
	//                     </div>`
	// 				news.appendChild(blockNews)
	// 			}
	// 		}
	// 	} else {
	// 		let blockNews = document.createElement('div')
	// 		blockNews.classList.add('news-block', 'opacity-1')
	// 		blockNews.innerHTML = `
	//             <div class="news-header">
	//                 <div class="header-text">
	//                     <div class="title">Error.</div>
	//                 </div>
	//             </div>
	//             <div class="news-content">
	//                 <div class="bbWrapper">
	//                     <p>No se pudo obtener información.</p>
	//                 </div>
	//             </div>`
	// 		// news.appendChild(blockNews)
	// 	}
	// }

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
				instance: 'mainkra',
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
						'auth.jar'
					)}=https://account.zisamyy.xyz/api/yggdrasil`,
					'-Dauthlibinjector.side=client',
					'-Dauthlibinjector.yggdrasil.prefetched=eyJtZXRhIjp7InNlcnZlck5hbWUiOiJ6aVNhbXl5IEF1dGgiLCJpbXBsZW1lbnRhdGlvbk5hbWUiOiJZZ2dkcmFzaWwgQVBJIGZvciBCbGVzc2luZyBTa2luIiwiaW1wbGVtZW50YXRpb25WZXJzaW9uIjoiNS4xLjUiLCJsaW5rcyI6eyJob21lcGFnZSI6Imh0dHBzOlwvXC9hY2NvdW50Lnppc2FteXkueHl6IiwicmVnaXN0ZXIiOiJodHRwczpcL1wvYWNjb3VudC56aXNhbXl5Lnh5elwvYXV0aFwvcmVnaXN0ZXIifSwiZmVhdHVyZS5ub25fZW1haWxfbG9naW4iOnRydWV9LCJza2luRG9tYWlucyI6WyJhY2NvdW50Lnppc2FteXkueHl6Il0sInNpZ25hdHVyZVB1YmxpY2tleSI6Ii0tLS0tQkVHSU4gUFVCTElDIEtFWS0tLS0tXG5NSUlDSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQWc4QU1JSUNDZ0tDQWdFQTdCWHI5cVFZaWdJNlRPbTQ3VHlCXG5VUGgrR2g5SHd1eXpycHpRZW1yajdQQW5sM0tSMXgzUVFkXC9yS2JiQTZkWW5ydXF5V2tmcWtSTld2SThhWWRzdlxuWU54YXU2UnNjVmFuRkFRemlpaDlnbDJDWityZkNlcHhVaXRJaDRXdmZib1VaQ2UrOWNkNFwvMVh6bm1KTFZob3dcbjkrQ1RKMm5QdWFGc1pYblpCVFZqMG5BbkJnaFZoR0NxaEwxMGhrOTBQR3NwU3FtYUpnTDJ0R1Y4TURDN3gzV3FcbkZvVGZ1XC9YcFwvZmNHQjRBNkQrZng3VXBcL09Hc0VLdWtBYm0yYnpXTW81aUlcL2EzMTViNmgrNVY5czIxbHZkK0tEXG41OWhhdnk4WGJ5emRhNk5aSWRSYm9UUFlcL1ZUZmdsK3BoK1RwZFd0c25NanF0NmVMbmRIckk5M3F6UWlaQllYOFxuRkxOUDk4WjVqWFZzTUkyemNSelpTM3VPZlpTM0oxeXNPN0lnamxvN2VCQ1g5cGlya3VrbVRBUzNGZXlGSnZBbVxuOE0xXC9ER0NNTE4xTmZJTzhvV2JBSnN5VGtJVGxpenZ3V2VoZEtrd0pJa2U0SGMyOTNBSTA4cUhlbmsrcFlhVDFcbmJrdmlNUm1aZHBuVzljblwvc09QenJ5Y1I3S0FwNmdWRk5iOTVlY01PdnNKNXQxVW1ob2Z6a0ZYT2dzb2FOMEdFXG56RmhudXVcL2kyVEpnQndiUkR1ZjFCaHBpbkhmVGs1M1BZVUVLaFBXYXFwa2ZvTTlHT2VweGNaRUFtXC9uUjJ0MEpcbnFrMzdUVzF6K1cweDc2SWxsclIxeFg2eFRPXC85YnVQYWVLT2pOY0xnb0hmc0tRRzJFSEhGaWlic1BMejVwWVJTXG5LQ1pHNDJneVhwK2UySU90cElDTWxJc0NBd0VBQVE9PVxuLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tXG4ifQ==',
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

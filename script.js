const Config = {
	title: "E.E.T",
	author: "Plasmablake",
	tagline: { en: "A FNF Mod based around FPE, Kaaatieverse", ru: "Мод для FNF основанный на FPE, Kaaatieverse" },
	links: { Discord: "https://discord.com/invite/W49Qqpbr88", YouTube: "https://youtube.com/@plasmablake", X: "", TikTok: "", GameBanana: "", GitHub: "" },
	countdown: { date: "2027-01-01T12:00:00Z", title: { en: "Gameplay Teaser", ru: "Геймплейный тизер" } },
	repo: "",
	counterKey: ""
}

const T = {
	en: { home: "Home", art: "Fan-Art", progress: "Progress", downloads: "Downloads", d: "Days", h: "Hours", m: "Minutes", s: "Seconds", all: "View all fan-art", views: "Visitors", empty: "Nothing here yet.", get: "Download", soon: "More coming soon.", total: "Overall", join: "Want your art featured? Send it on", lang: "RU", release: "Release", beta: "Beta", since: "Compared to your visit on", new: "New" },
	ru: { home: "Главная", art: "Фан-арт", progress: "Прогресс", downloads: "Загрузки", d: "Дней", h: "Часов", m: "Минут", s: "Секунд", all: "Весь фан-арт", views: "Посетители", empty: "Пока пусто.", get: "Скачать", soon: "Скоро будет больше.", total: "Всего", join: "Хочешь, чтобы твой арт показали? Отправь его в", lang: "EN", release: "Релиз", beta: "Бета", since: "По сравнению с визитом", new: "Новое" }
}

let Lang = localStorage.lang || "en"
let Gal = []
let Idx = 0
let Seq = 0
const Cache = {}
let Seen = null
try { Seen = JSON.parse(localStorage.seen || "null") } catch { }
const Mark = (kind, items) => {
	let s = {}
	try { s = JSON.parse(localStorage.seen || "{}") } catch { }
	s[kind] = items
	s.t = Date.now()
	localStorage.seen = JSON.stringify(s)
}
const $ = i => document.getElementById(i)
const app = $("app")
const box = $("box")
const t = k => T[Lang][k]
const pick = (o, k) => o[k + "_" + Lang] || o[k] || ""
const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";")
const Safe = u => /^(https?:|[^:]*$)/i.test(u) ? esc(u) : "#"
const Name = p => p.split("/").pop().replace(/\.[^.]+$/, "").replace(/_+/g, " ")
const byDate = (a, b) => String(b.date || "").localeCompare(String(a.date || ""))
const Letters = s => [...s].map(c => c === " " ? '<i class="sp"></i>' : `<i>${esc(c)}</i>`).join("")
const Digits = n => [...n.toLocaleString("en-US")].map(c => c === "," ? "<b>,</b>" : `<span class="d"><em style="--n:${c}">0<br>1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9</em></span>`).join("")
const Pic = (p, i) => `<figure data-open="${i}"><img src="${encodeURI(p)}" loading="lazy" decoding="async" alt="${esc(Name(p))}"><figcaption>${esc(Name(p))}</figcaption></figure>`
const Link = k => Config.links[k] ? `<a class="btn alt" href="${Safe(Config.links[k])}" target="_blank" rel="noopener">${k}</a>` : ""

function RepoGuess() {
	if (Config.repo) return Config.repo
	if (!location.hostname.endsWith(".github.io")) return ""
	const owner = location.hostname.split(".")[0]
	const seg = location.pathname.split("/")[1]
	return owner + "/" + (seg && !seg.includes(".") ? seg : owner + ".github.io")
}

async function Tree() {
	const repo = RepoGuess()
	if (!repo) return null
	const key = "tree:" + repo
	let cached = null
	try { cached = JSON.parse(localStorage[key] || "null") } catch { }
	if (cached && Date.now() - cached.t < 6e5) return cached.p
	for (const ref of ["HEAD", "main", "master"]) {
		try {
			const r = await fetch(`https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`)
			if (!r.ok) continue
			const p = (await r.json()).tree.filter(x => x.type === "blob").map(x => x.path)
			localStorage[key] = JSON.stringify({ t: Date.now(), p })
			return p
		} catch { }
	}
	return cached ? cached.p : null
}

const TreeP = Tree()

async function Files(dir) {
	const tree = await TreeP
	if (tree) return tree.filter(p => p.startsWith(dir + "/") && !p.slice(dir.length + 1).includes("/"))
	try {
		const html = await (await fetch(dir + "/")).text()
		return [...html.matchAll(/href="([^"?#]+)"/g)].map(m => decodeURIComponent(m[1])).filter(h => !h.endsWith("/") && !h.includes(":") && !h.startsWith(".")).map(h => dir + "/" + h)
	} catch {
		return []
	}
}

const Imgs = () => Cache.art ??= Files("art").then(f => f.filter(p => /\.(png|jpe?g|gif|webp|avif)$/i.test(p)))
const Json = dir => Cache[dir] ??= Files(dir).then(f => Promise.all(f.filter(p => /\.json$/i.test(p)).map(p => fetch(encodeURI(p)).then(r => r.json()).catch(() => null)))).then(a => a.filter(Boolean))

async function Views() {
	const ns = (Config.counterKey || RepoGuess() || location.hostname).toLowerCase().replace(/[^a-z0-9]+/g, "-")
	const hit = !sessionStorage.hit
	const urls = [
		`https://api.counterapi.dev/v1/${ns}/views/${hit ? "up" : ""}`,
		`https://abacus.jasoncameron.dev/${hit ? "hit" : "get"}/${ns}/views`
	]
	for (const u of urls) {
		try {
			const j = await (await fetch(u)).json()
			const n = j.count ?? j.value
			if (typeof n !== "number") continue
			sessionStorage.hit = 1
			localStorage.views = n
			return n
		} catch { }
	}
	return +localStorage.views || 0
}

const ViewsP = Views()

async function Home() {
	const [art, news] = await Promise.all([Imgs(), Json("news")])
	Gal = art
	const n = news.sort(byDate).slice(0, 3)
	const fresh = x => Seen && Seen.news && !Seen.news.includes(x.title)
	Mark("news", news.map(x => x.title))
	return `<section class="sheet hero"><h1 class="word">${Letters(Config.title)}</h1><p class="tag">${esc(Config.tagline[Lang])}</p><div class="btns"><a class="btn" href="#/downloads">${t("downloads")}</a>${Link("Discord")}</div></section>`
		+ (n.length ? `<section class="notes">${n.map((x, i) => `<article class="memo m${i}">${fresh(x) ? `<span class="stamp">${t("new")}</span>` : ""}<time>${esc(x.date || "")}</time><h3>${esc(pick(x, "title"))}</h3><p>${esc(pick(x, "text"))}</p></article>`).join("")}</section>` : "")
		+ (art.length ? `<section class="sheet"><h2>${t("art")}</h2><div class="line">${art.slice(0, 8).map(Pic).join("")}</div><a class="btn" href="#/fan-art">${t("all")}</a></section>` : "")
}

async function ArtPage() {
	const art = await Imgs()
	Gal = art
	const join = Config.links.Discord ? `<p class="hint">${t("join")} <a href="${Safe(Config.links.Discord)}" target="_blank" rel="noopener">Discord</a></p>` : ""
	return `<section class="sheet"><h2>${t("art")}</h2>${join}${art.length ? `<div class="grid">${art.map(Pic).join("")}</div>` : `<p>${t("empty")}</p>`}</section>`
}

async function ProgressPage() {
	const items = (await Json("progress")).sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
	const avg = items.length ? Math.round(items.reduce((s, p) => s + (+p.percent || 0), 0) / items.length) : 0
	const old = Seen && Seen.progress
	Mark("progress", Object.fromEntries(items.map(p => [p.title, +p.percent || 0])))
	const rows = items.map(p => {
		const v = Math.min(100, Math.max(0, +p.percent || 0))
		const was = old ? old[p.title] : undefined
		const up = !old ? "" : was === undefined ? `<small class="up fresh">${t("new")}</small>` : v !== Math.round(was) ? `<small class="up">${v > was ? "▲ +" : "▼ "}${Math.round(v - was)}%</small>` : ""
		const note = pick(p, "note")
		const title = esc(pick(p, "title"))
		const who = p.logo ? `<img${p.invert ? ' class="inv"' : ""} src="${Safe(p.logo)}" alt="${title}">` : `<h3>${title}</h3>`
		return `<div class="row${p.logo ? " logo" : ""}"><div class="who">${who}</div><span class="pc">${v}%${up}</span><div class="ecg"><i class="beat" style="--p:${v}%;--t:${(1.1 + (100 - v) / 100 * 2.6).toFixed(2)}s"></i></div>${note ? `<p>${esc(note)}</p>` : ""}</div>`
	}).join("")
	return `<section class="sheet"><h2>${t("progress")}</h2>${items.length ? `<span class="stamp big">${t("total")} ${avg}%</span>${old && Seen.t ? `<p class="since">${t("since")} ${new Date(Seen.t).toLocaleDateString(Lang, { day: "numeric", month: "short" })}</p>` : ""}${rows}` : `<p>${t("empty")}</p>`}</section>`
}

async function DownloadsPage() {
	const items = (await Json("downloads")).sort(byDate)
	const cards = items.map(p => {
		const g = pick(p, "tag")
		const cls = String(p.tag || g).toLowerCase().replace(/[^a-z0-9]+/g, "")
		return `<article class="card">${g ? `<span class="stamp ${cls}">${esc(T[Lang][g.toLowerCase()] || g)}</span>` : ""}${p.image ? `<img class="th" src="${Safe(p.image)}" alt="">` : ""}<h3>${esc(pick(p, "title"))}</h3><time>${esc(p.date || "")}</time><p>${esc(pick(p, "description"))}</p><a class="btn" href="${Safe(p.link || "")}" target="_blank" rel="noopener">${t("get")}</a></article>`
	}).join("")
	return `<section class="sheet"><h2>${t("downloads")}</h2>${cards ? `<div class="cards">${cards}</div>` : `<p>${t("empty")}</p>`}<p class="soon">${t("soon")}</p></section>`
}

const Pages = { "": Home, "fan-art": ArtPage, progress: ProgressPage, downloads: DownloadsPage }

const Key = () => {
	const k = location.hash.replace(/^#\/?/, "")
	return k in Pages ? k : ""
}

function Tick() {
	const cd = Config.countdown
	if (!cd) return
	const s = Math.max(0, Math.floor((new Date(cd.date) - Date.now()) / 1e3))
	const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]
	document.querySelectorAll("#cd b").forEach((b, i) => b.textContent = String(v[i]).padStart(2, "0"))
}

function Fallback(img) {
	if (!img.dataset.t) {
		img.dataset.t = 1
		img.src = img.src.replace(/\.png$/, ".svg")
		return
	}
	img.replaceWith(img.alt)
}

function Shell() {
	const cd = Config.countdown
	document.documentElement.lang = Lang
	document.title = Config.title
	$("brand").textContent = Config.title
	$("nav").innerHTML = [["", "home", "home"], ["fan-art", "art", "fanart"], ["progress", "progress", "progress"], ["downloads", "downloads", "download"]].map(([h, k, i]) => `<a href="#/${h}" class="${h === Key() ? "on" : ""}"><img src="icons/nav/${i}.png" alt=""><span>${t(k)}</span></a>`).join("") + `<button id="lang">${t("lang")}</button>`
	$("cdw").innerHTML = cd && new Date(cd.date) > Date.now()
		? `<div id="cd"><div><strong>${esc(cd.title[Lang])}</strong><small>${new Date(cd.date).toLocaleString(Lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}</small></div>${["d", "h", "m", "s"].map(k => `<div><b>00</b><small>${t(k)}</small></div>`).join("")}</div>`
		: ""
	Tick()
	$("foot").innerHTML = `<div class="ticket"><span>${t("views")}</span><span id="v"></span></div><div class="links">${Object.entries(Config.links).filter(([, u]) => u).map(([k, u]) => `<a href="${Safe(u)}" target="_blank" rel="noopener" aria-label="${esc(k)}"><img src="icons/${k.toLowerCase().replace(/[^a-z0-9]+/g, "")}.png" alt="${esc(k)}" onerror="Fallback(this)"></a>`).join("")}</div><small>© ${new Date().getFullYear()} ${esc(Config.author)}</small>`
	ViewsP.then(n => { $("v").innerHTML = Digits(n) })
}

async function Render() {
	const id = ++Seq
	Shell()
	app.classList.remove("lay")
	app.innerHTML = ""
	let html
	try { html = await Pages[Key()]() } catch { html = `<section class="sheet"><p>${t("empty")}</p></section>` }
	if (id !== Seq) return
	app.innerHTML = html
	void app.offsetWidth
	app.classList.add("lay")
}

function Show(i) {
	if (!Gal.length) return
	Idx = (i + Gal.length) % Gal.length
	$("bimg").src = encodeURI(Gal[Idx])
	$("bcap").textContent = Name(Gal[Idx])
	box.hidden = false
}

addEventListener("hashchange", () => {
	Render()
	scrollTo(0, 0)
})

document.addEventListener("click", e => {
	const f = e.target.closest("[data-open]")
	if (f) return Show(+f.dataset.open)
	if (e.target.closest("#lang")) {
		Lang = Lang === "en" ? "ru" : "en"
		localStorage.lang = Lang
		return Render()
	}
	if (e.target.closest(".x") || e.target === box) box.hidden = true
	if (e.target.closest(".pv")) Show(Idx - 1)
	if (e.target.closest(".nx")) Show(Idx + 1)
})

addEventListener("keydown", e => {
	if (box.hidden) return
	if (e.key === "Escape") box.hidden = true
	if (e.key === "ArrowLeft") Show(Idx - 1)
	if (e.key === "ArrowRight") Show(Idx + 1)
})

const Fav = new Image()
Fav.onload = () => $("fav").href = "favicon.png"
Fav.src = "favicon.png"

const Bg = new Image()
Bg.onload = () => document.body.classList.add("bg")
Bg.src = "backgroundimage.png"

addEventListener("pointermove", e => {
	const r = document.documentElement.style
	r.setProperty("--mx", e.clientX + "px")
	r.setProperty("--my", e.clientY + "px")
})

setInterval(Tick, 1000)
Render()

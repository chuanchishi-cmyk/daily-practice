# 日課 Daily Practice：App 設定表（模板）

> 用途：兩件事。
> 1. **之後做新 App 的模板**：照這份的架構、設計規格、部署流程走，只換內容。
> 2. **換新的工作空間（新對話 / 新 session）時的交接文件**：新空間的 Claude 讀這份就能接手維護。
>
> 最後更新：2026-11-19　｜　Service Worker 版本：見 `sw.js` 第 2 行 `CACHE='rike-vNN'`

---

## 1. 基本資料

| 項目 | 值 |
|---|---|
| App 名稱 | 日課 Daily Practice（短名：日課） |
| 語言 | 繁體中文（主）＋ 英文（自動翻譯層） |
| 網站版（PWA） | https://chuanchishi-cmyk.github.io/daily-practice/ |
| 安裝說明頁 | https://chuanchishi-cmyk.github.io/daily-practice/guide.html |
| GitHub repo | `chuanchishi-cmyk/daily-practice`（舊名 `study-desk`，GitHub 會自動轉址） |
| 部署方式 | GitHub Pages，`main` 分支根目錄，push 後約 1 分鐘上線 |
| claude.ai 版 | https://claude.ai/artifact/CtM7ggrWV9W7UAzbftZpbe |
| 原始碼（唯一來源） | `src/studydesk.html` |

---

## 2. 檔案結構

```
daily-practice/
├─ src/studydesk.html        ← 唯一原始碼（Artifact 版，STANDALONE=false）。所有修改都改這裡
├─ index.html                ← 由 tools/build.py 產生（STANDALONE=true，加上 PWA 的 <head>）。不要手改
├─ sw.js                     ← Service Worker：離線快取；每次發版把 CACHE 版本號 +1
├─ manifest.webmanifest      ← PWA 名稱、圖示、顏色
├─ guide.html                ← 手機/電腦安裝說明（LINE 分享用）
├─ i18n-en.js                ← 英文翻譯（由 tools/i18n/build-i18n.py 產生）
├─ icon-192.png / icon-512.png / icon-maskable-512.png / apple-touch-icon.png / favicon-32.png
├─ qr.png                    ← 網站 QR code（設定頁、分享視窗使用）
├─ ocean.mp3                 ← 白噪音「潮汐」音檔（立體聲 96kbps）（claude.ai 版發佈時要用 files 一起上傳）
├─ docs/APP-SETTINGS.md      ← 本文件
└─ tools/
   ├─ build.py               ← src → index.html
   ├─ i18n/                  ← 翻譯工具：en1–en8.tsv（對照表）、build-i18n.py、missing.py、engine.js、pieces.json
   └─ tests/                 ← Playwright 冒煙測試（pomodoro-cycle.js、meditation-sounds.js、top3-tomorrow.js、lockscreen-noise.js、jieqi-intro.js、test-timer-log.js）
```

---

## 3. 技術架構

| 項目 | 設定 |
|---|---|
| 形式 | **單一 HTML 檔**：CSS、JS、SVG 圖示全部內嵌；不用框架、不用打包工具 |
| 外部依賴 | 只有 Google Fonts（IBM Plex Mono、Noto Sans TC、Noto Serif TC）；斷網時退回系統字體 |
| 兩種版本 | `const STANDALONE=false` → claude.ai Artifact 版；build 時改成 `true` → 網站 PWA 版 |
| 路由 | `location.hash`（`#today`、`#mind`…），`render()` 整頁重繪 |
| 事件 | 事件委派：`data-act="xxx"` → `A.xxx(el)`；`data-ch` → change 事件；`data-in` → input 事件 |
| 狀態 | 全域物件 `S`（主要資料）、`P`（番茄鐘）、`T`（測驗計時）、`MT`（靜心計時） |
| 計時 | `setInterval(tick,250)`，以 `endAt` 時間戳計算剩餘時間（切到背景也準） |

### Artifact 版的 capabilities（claude.ai）
`db`（雲端資料）、`user`（辨識使用者）、`downloads`（匯出備份）、`sample`（AI 小助手）、`mcp: Google Calendar`（讀行事曆）

---

## 4. 外觀設計規格（Design Tokens）

### 4.1 顏色：淺色（預設）

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#f6f3ee` | 頁面底色（米白） |
| `--surface` | `#fffdfa` | 卡片 |
| `--sunk` | `#f0ece5` | 側欄、凹陷區 |
| `--ink` | `#3b3631` | 主要文字 |
| `--muted` | `#8a8178` | 次要文字 |
| `--line` | `#e8e2d8` | 分隔線、邊框 |
| `--accent` | `#c2704f` | 主色（陶土橘）：主要按鈕 |
| `--focus` | `#5e8977` | 焦點、連結、勾選（青綠） |
| `--good` / `--warn` / `--bad` | `#5a8a5e` / `#b98638` / `#b65a4e` | 狀態色 |
| 金點（選單選中標記） | 金色小圓點 | 對齊選中項目中心 |

**分類色票 `--c0`～`--c11`**（標籤、圖表用，柔和不刺眼）：
`#5f8f8c` `#c39a4c` `#8b7bae` `#6a8db2` `#c2704f` `#7c9a68` `#ad7898` `#999263` `#ae845e` `#5c9886` `#bd7383` `#7c88a4`

### 4.2 顏色：深色
`--bg #1c1a17`、`--surface #25221e`、`--sunk #201e1a`、`--ink #ece6dd`、`--muted #a3998e`、`--line #37322c`、`--accent #e08d6b`、`--focus #8bb5a3`
（主題：跟隨系統／淺色／深色；**手機預設淺色**）

### 4.3 字體

| 用途 | 字體堆疊 |
|---|---|
| 內文 `--f-body` | `-apple-system, "PingFang TC", "Noto Sans TC", system-ui, "Microsoft JhengHei", sans-serif`（蘋果裝置用系統蘋方，避免網路字體分段載入造成字形混雜） |
| 標題 `--f-display` | `"Noto Serif TC", "Songti TC", "PMingLiU", "PingFang TC", serif`（明體，古意） |
| 數字 `--f-mono` | `"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, -apple-system, "PingFang TC", …`（計時器、數字；中文自動退回黑體） |

- 基準字級 14px；所有字級寫成 `calc(Npx * var(--fs,1))`，讓使用者可調。
- 字級選項：小 0.9／**中 1（預設）**／大 1.15／特大 1.3
- 版面縮放：電腦預設 100%，**手機預設 110%**
- 圓角 `--r: 14px`；陰影極淡（`rgba(80,60,40,.05)`）

### 4.4 風格原則
- 精緻、大器、簡約、溫暖；米白底＋陶土橘＋青綠。
- 提示語溫和、貼近使用者，不說教、不過度情感。
- 標記統一用英文或符號：`1/3`、`D-30`、`✓`、`NEW`、`!`；手機上改成彩色小點。
- 每個輸入欄都有「例：…」的預設引導語。

---

## 5. 版面與響應式

| 裝置 | 條件 | 版面 |
|---|---|---|
| 電腦 | `min-width:821px` | 左側直式選單（200px）＋內容 |
| 大螢幕 | `min-width:1500px` | 內容加寬 |
| 手機直式 | `max-width:820px` | 上方橫向圖示選單（可左右滑，小球捲軸），單欄 |
| 手機橫放 | `landscape and max-height:500px and pointer:coarse` | 設定可選：**寬版（預設）**／直式窄欄置中；不顯示旋轉提示 |
| iPad 直式 | `601–820px and min-height:560px` | 兩欄 |
| iPad 橫式 | `821–1199px and pointer:coarse` | 側欄版 |

- 手機判斷：`Math.min(screen.width,screen.height)<=600 && pointer:coarse`
- 安全區：`env(safe-area-inset-*)`，支援瀏海機
- 頁面最大寬度用 `100%`，不要用 `100vw`（縮放時會溢出）
- 選單順序使用者可自訂（設定 → 選單順序）
- 設定頁內容較多的區塊用 `fold(id,標題,摘要,內容)` 做成可收放卡片（預設收起，收起時顯示一行摘要，展開狀態記在 `sd-fold`）

---

## 6. 功能模組

| 選單 | hash | 內容 |
|---|---|---|
| 今日 | `#today` | 預設精簡：番茄鐘、今天三件事、目標倒數橫幅；其餘（今日專注紀錄、精力・專注度、計數、靜心、待複習、計畫下一步、目標倒數、心境、本週專注）是可加入的小卡片（`WIDGETS`，預設 `WIDGET_DEF=[]`）。番茄鐘（專注/短休/長休循環）、標籤（可自填）、暫停筆記、提前結束原因、雜念停車場、今天三件事、精力/專注度、考試倒數橫幅。晚上自動出現「明天的三件事」與沒做完的事的處理（見第 21 節） |
| 計畫地圖 | `#plan` | 多種計畫範本、階段與步驟、彈性時間線、步驟細節筆記、今天的最小一步（成功模式） |
| 目標衝刺 | `#exam` | 情境：考試／比賽／演出／發表／自訂（`cfg.exScene`），整頁用語、每日提醒、預設計時項目一起換（`EXS`、`EX_TIPS`、`EX_FOCUS`、`EXS_TIMERS`）；選單名稱可自訂（`cfg.exPage`，預設「目標衝刺」）；自訂情境的用語在 `cfg.exLabels`。倒數、每日提醒、分段計時（可刪減項目）、紀錄、複習本。資料不隨情境改變 |
| 月曆 | `#calendar` | 每日紀錄、Google 行事曆匯入、會談（跳轉 Google Calendar / Gmail 預填） |
| 靜心 | `#mind` | 靜心計時（時間可自訂，最少 3 組，預設 3/5/10/15/30/60 分）、多種禪修方法、一天多次紀錄 |
| 覺察日記 | `#journal` | 早晨意向固定第一；其餘區塊填完後，下次進來會移到最後並收合成一行摘要（同一次瀏覽中不跳動）。情緒清單預設精簡，按「展開說明…」看每個情緒的說明，「收起說明」收回（`sd-emo-mode`）。回顧（圖表＋搜尋） |
| 統計 | `#stats` | 週/月統計、番茄、靜心分鐘與安住程度趨勢 |
| 我的節奏 | `#quiz` | 時型問卷（多選、不確定選項、信心權重）、分段結果、總報告 |
| （首次使用） | 歡迎卡第 2 張 | 選擇用途（最多 3 個，`PUR_MAX`）：讀書與工作專注／準備考試比賽演出／研究寫作／身心照顧，決定預設顯示的頁面（`PURPOSES`、`cfg.purposes`）；已取消「全部都看看」，沒選到的頁面由小建議卡慢慢介紹；設定裡可「依用途重新選擇」 |
| 每日提醒 | 設定 → 提醒 | 不靠伺服器：產生 .ics 行事曆檔（含 RRULE 重複規則與 VALARM 提醒）或 Google 日曆連結，由手機行事曆通知（`RM_DEF`、`cfg.reminders`）；目標衝刺的日期卡可匯出 D-30/14/7/3/1 與當天 |
| 設定 | `#prefs` | 分組：日常使用／提醒／外觀與語言／資料與同步／分享與說明 |

預設番茄設定：專注 25、短休 5、長休 15、每 4 個長休一次。

---

## 7. 聲音規格

| 計時器 | 開始 | 結束 |
|---|---|---|
| 番茄鐘（專注、休息） | 無 | `ring()`：880/660 Hz 清脆「嘀－嘟－嘀」，**重複兩次** |
| 測驗計時（每段、全部） | 無 | `ring()`（同上）；剩 5 分、1 分鐘時 `warnTone()` 一聲＋數字閃爍 10 秒（設定 `sd-xwarn`，預設開） |
| 白噪音（今日番茄鐘計時時） | 專注時、休息時各選一種：不播／夜晚蟲鳴／潮汐 | **休息預設潮汐、專注預設不播**（`sd-noise-b`、`sd-noise-w`；舊版 `sd-noise-on`+`sd-noise-k` 開過的人，專注時沿用原選擇）。靜心時自動停止。潮汐用 `ocean.mp3`（1.08 MB，立體聲 96kbps）；蟲鳴以物理模型即時合成（0 KB）：不同距離的蟋蟀與遠方樹蟋；立體聲、加空間殘響，40 秒無縫循環，開啟 App 後背景預先產生。音量 `sd-noise-v` |
| 靜心 | `smallWoodfish(3,6)`：三聲木魚，間隔 6 秒 | `yinqing(1,0)`：一聲引磬 |

技術要點（iPhone 相容）：
- 聲音以 Web Audio 的**音訊時鐘預先排程**（`schedule()` / `syncSched()`），螢幕關掉也能響。
- 背景保活：迴圈播放一段**完全無聲**的 WAV（樣本全為 128）。不可用「幾乎無聲」，iPhone 會忽略音量而聽到雜音。
- 每次開始計時都重建 AudioContext（`freshAudio()`），避免 iPhone 上一段結束後音訊卡住而沒聲音。正在靜心時不重建，避免打斷木魚。
- 音量設定 `sd-vol`（0–100），「試聽」播 `ring()`。
- **鎖定畫面／控制中心**：背景保活音檔會讓系統顯示播放控制。`navigator.mediaSession` 的 play/pause 接到計時器（`msPlay`／`msPause`，對象 `msTarget()`：執行中或暫停中的番茄、靜心、測驗計時），標題顯示「番茄鐘・專注中／剩 18 分」，暫停後保留控制 5 分鐘。從鎖定畫面繼續時不重建 AudioContext（只 `unlockAudio`）。需在 iPhone 實機確認。
- 番茄結束：畫面自動切到下一個模式（專注 → 短休/長休 → 專注），需按「開始」才計時。

---

## 8. 資料儲存

| 層 | 說明 |
|---|---|
| 主資料 | `localStorage['studydesk-v1']`（JSON，物件 `S`） |
| Artifact 版 | 另存 claude.ai 雲端 `db`（登入者私人空間） |
| 每日快照 | `sd-snaps`：每天一份＋每次改版前一份，可在設定還原 |
| 匯出/匯入 | 設定 → 匯出 JSON 備份；手機可用「分享」存到檔案 |
| Google 雲端硬碟同步 | `drive.appdata` 範圍（隱藏的 App 資料夾），每筆有時間戳 `MT_`、刪除墓碑 `TOMB`，雙向合併 |
| 持久化 | 啟動時呼叫 `navigator.storage.persist()`，降低被瀏覽器清除的機會 |

**改版不會刪使用者資料**：資料在使用者的瀏覽器／雲端，不在程式檔裡。新增欄位時一律給預設值、不改舊鍵名。

主要 localStorage 鍵（前綴 `sd-`）：
`sd-theme` 主題、`sd-fs` 字級、`sd-zoom` 縮放、`sd-land` 橫放版面、`sd-lang` 語言、`sd-vol` 音量、`sd-bg` 螢幕關掉也響鈴、`sd-wake` 保持螢幕亮著、`sd-pomo` 番茄狀態、`sd-xtimer` 測驗計時、`sd-mtimer` 靜心計時、`sd-quiz` 問卷、`sd-snaps` 快照、`sd-gd-on` / `sd-gd-last` 雲端硬碟同步、`sd-tomb` 刪除紀錄、`sd-welcome` 歡迎卡、`sd-splash` 開場動畫、`sd-ver` 版本、`sd-lastexport` 上次匯出
（sessionStorage：`sd-gd-tok`、`sd-gc-tok` Google 權杖；`sd-splash-seen`；`sd-updated`）

---

## 9. PWA 與更新

- `manifest.webmanifest`：`display: standalone`，底色/主題色 `#f6f3ee`，含 maskable 圖示。
- `sw.js`：頁面「網路優先」、字型與圖示「快取優先」。**每次發版必須把 `CACHE='rike-vNN'` 加 1**，舊快取才會被清掉。
- `index.html` 的 `<head>` 會註冊 SW（`updateViaCache:'none'`）。回到前景時、每小時檢查更新；換版時自動重新載入並顯示「已更新到最新版」。
- 網址固定不變，舊的 LINE 分享連結永遠有效。
- OG 標籤：分享到 LINE/FB 時顯示圖示與介紹。
- LINE 內建瀏覽器會提示「用 Safari/Chrome 開啟」才能加到主畫面。

---

## 10. Google 整合（網站版）

| 項目 | 值 |
|---|---|
| OAuth Client ID | `639910884576-g2mit90cn584j6ccp7hm9hef3t1ta73j.apps.googleusercontent.com`（公開值，非密鑰） |
| 雲端硬碟範圍 | `https://www.googleapis.com/auth/drive.appdata` |
| 行事曆範圍 | `https://www.googleapis.com/auth/calendar.readonly` |
| 授權的 JavaScript 來源 | `https://chuanchishi-cmyk.github.io` |
| 需啟用的 API | Google Drive API、Google Calendar API（Google Cloud Console） |

新 App 要用自己的 Client ID：Google Cloud Console → API 和服務 → 憑證 → 建立 OAuth 用戶端（網頁應用程式），填入新網址為授權來源。

---

## 11. 多語（英文）

1. 中文寫在 `src/studydesk.html`（照常寫中文即可）。
2. 新字串的英文加到 `tools/i18n/en8.tsv`，一行一筆：`=中文<Tab>English`。
3. `python3 tools/i18n/build-i18n.py i18n-en.js` 產生翻譯檔。
4. `python3 tools/i18n/missing.py index.html` 檢查漏翻（剩 10–25 筆提示詞/信件範本屬正常）。

---

## 12. 發版流程（每次修改都照做）

在 repo 根目錄：

```bash
# 1. 修改 src/studydesk.html（必要時補 tools/i18n/en8.tsv）
# 2. 產生網站版與翻譯
python3 tools/build.py
python3 tools/i18n/build-i18n.py i18n-en.js
# 2b. 原始碼裡把 APP_VER 改成今天（換版時自動存改版前快照），CHANGELOG 最上面加一筆（lv: major/minor/fix）
# 3. Service Worker 版本號 +1（例：v57 → v58）
sed -i "s/rike-v57/rike-v58/" sw.js
# 4. 測試
node tools/tests/pomodoro-cycle.js
node tools/tests/meditation-sounds.js
node tools/tests/top3-tomorrow.js
node tools/tests/lockscreen-noise.js
node tools/tests/jieqi-intro.js
node tools/tests/test-timer-log.js
# 5. 提交並推送（GitHub Pages 約 1 分鐘上線）
git add -A && git commit -m "說明這次改了什麼" && git push origin main
```

6. claude.ai 版：用 Artifact 工具發佈 `src/studydesk.html`，並帶 `url: https://claude.ai/artifact/CtM7ggrWV9W7UAzbftZpbe`（沿用同一網址），`files` 加上 `{"ocean.mp3": "ocean.mp3"}`。
7. 提醒使用者：手機把 App 完全關掉再開，就會換到新版。

注意：如果 push 被拒（遠端有別的 session 推過），先 `git pull --rebase`。若衝突在 `index.html`，把遠端的改動合回 `src/studydesk.html` 再重新 build，不要直接覆蓋。

---

## 13. 測試

- 工具：Playwright（雲端環境已內建 Chromium，`require('playwright')` 直接可用）。
- 模擬裝置：`devices['iPhone 13']`、iPhone 橫放、iPad Mini 直/橫、iPad Pro 橫。
- 時間快轉：`addInitScript` 替換 `Date`，用 `window.__off` 加時間。
- 聲音驗證：攔截 `OscillatorNode.prototype.start`，記錄頻率與排程時間。
- 跳過開場：預先寫入 `sessionStorage['sd-splash-seen']='1'`、`localStorage['sd-welcome']='true'`。

---

## 14. 用這份模板做新 App：檢查清單

- [ ] 新 repo（例：`my-new-app`），開啟 GitHub Pages（Settings → Pages → main / root）
- [ ] 複製 `src/studydesk.html` 的骨架：`:root` 色票、字體、`render()`／`A` 事件委派／`tick()`、設定頁分組、匯出入與快照
- [ ] 改 `tools/build.py` 裡的 `<head>`：App 名稱、描述、OG 網址與圖片
- [ ] 改 `manifest.webmanifest`：`name`、`short_name`、顏色
- [ ] 重做圖示：192、512、maskable 512、apple-touch 180、favicon 32
- [ ] `sw.js` 的快取名稱前綴換掉（例：`myapp-v1`），避免與日課混用
- [ ] localStorage 前綴換掉（`sd-` → 新前綴），主資料鍵也換名
- [ ] Google 整合：建立新的 OAuth Client ID，授權新網址
- [ ] 重新產生 QR code（指向新網址）
- [ ] 寫一份新 App 的 `docs/APP-SETTINGS.md`

---

## 15. 換新的工作空間繼續維護

所有東西都在 GitHub repo 裡（原始碼、build、翻譯、測試、本文件）。舊對話空間滿了也不影響。

在新的 Claude Code 對話中，先把 repo `chuanchishi-cmyk/daily-practice` 加進來，然後貼上：

> 請接手維護「日課」App。先閱讀 repo 裡的 `docs/APP-SETTINGS.md`，照第 12 節的發版流程工作：只改 `src/studydesk.html`，用 `tools/build.py` 產生 `index.html`，每次發版 `sw.js` 版本號 +1，推送到 main。claude.ai 版請發佈到既有網址 https://claude.ai/artifact/CtM7ggrWV9W7UAzbftZpbe。回覆我請用繁體中文。
>
> 這次要改的是：（寫下需求）


## 16. 預設內容的中性化（2026-11）

預設不再綁定托福：計數器（練習題／讀書頁數／喝水）、目標日期（空白）、測驗計時（單科練習／限時小考／整場模擬考）、複習本科目（其他）、計分預設「自訂項目」（托福 0–30／1–6 保留為明確標示的選項）。`cfg()` 會把「沒動過的舊托福預設」換成新預設；使用者實際用過的（例如計數器有紀錄、錯題用了舊科目）保留原名稱。

## 17. 漸進式介紹與更新通知

**小建議卡（今日頁上方）**：依使用者的實際行為，一次只推薦一個還沒用的功能（`tipList()`）。使用滿 3 天後才出現，每 3 天最多一則；按「打開／不用了」後當天不再出現，該則永不重複。狀態存在 `sd-tips`（每台裝置各自記錄），首次使用日 `sd-first`（取最早的紀錄日）。

**更新的四個等級（2026-11-19）**：公告不會累積，每個人只看到「現在對他有用的一則」。
- **重大更新**（`major`）：在 `WHATSNEW` 最上方加 `{id, lv:'major', d, t, b, go/page, btn}`。只給「發布日之前就在使用」的人，且只在發布後 14 天內；同時有好幾則只顯示最新一則，其餘自動略過。
- **一般更新**（`minor`）：不發 NEW。寫成 `tipList()` 的資訊卡（附條件：還沒用過、適合的時段），併入小建議輪播（滿 3 天、每 3 天最多一則）。
- **調整除錯**（`fix`）：靜默更新。
- 三種都在 `CHANGELOG` 最上面加一筆，顯示在「設定 → 更新紀錄」，並把 `APP_VER` 改成發版日。
- **公告**：`ANNOUNCE` 加 `{id, from, to, t}`，頂部橫幅，可按「知道了」（`sd-ann`），過了 `to` 自動消失。
- 小建議卡與重大更新卡在睡前到起床的安靜時段不出現。

## 18. 備份提醒

只在資料沒有其他保護時出現（網站版、沒開 Google 同步）：第一次在開始使用 3 天後，之後每次備份後 14 天提醒一次（`BK_EVERY`）；「稍後提醒」延後 7 天（`BK_SNOOZE`，`sd-bk-snooze`）。不再在每一頁常駐橫幅。

## 19. 靜心回饋

觀察筆記後有「下次怎麼做」欄位（`x.next`），隔天會顯示在計時器上方「上次給自己的提醒」。「看看回饋」依干擾選項＋筆記關鍵字比對 `MZ_FB`（昏沉、掉舉、念頭、身體、聲音、憤怒、焦慮、低落、期待、自責、疑惑、安定），回覆 3–5 句；找不到對應時給一般鼓勵。安全優先：偵測到自傷字眼（`MZ_CRISIS`）只給求助資訊（1925／1995），強烈不適（`MZ_DISTRESS`）建議暫停並尋求專業協助。完全離線，不送出任何內容。回覆語料之後可依使用者提供的「禪修實踐與對治」資料庫調整。

**回饋語料來源（2026-11-18 更新）**：依使用者 Google 雲端硬碟「閱讀書庫／中文書／禪修」中的聖嚴法師《法鼓全集》第四輯（04-01、03、04、09、14、17、18）擷取對治段落改寫：昏沉（輕則睜眼提神、重則小睡；緊張致疲倦）、妄念（不怕不壓、認得不隨、貓捕鼠）、腿痛（輕痛不管、重痛放腿、甩腿按摩）、放鬆（從眼球到小腹）、期待（不求效果、不怕壞境界、不求好境界；破繭喻）、情緒（面對它、接受它、處理它）、退步（進進退退是常態）、特殊覺受（不迎不拒；不安即暫停求助）。用語去除佛教名相，回饋下方標示「參考聖嚴法師的禪修指導整理」。同資料夾其他書（阿姜查、馬哈希、我可能錯了等）尚未納入。

**回饋呈現（2026-11-18）**：預設 4–6 句＝承接 1 句（`a`，有情緒時先同理，否則回應使用者的狀況）＋精簡調適與鼓勵 3 句（`b`）＋若有填「下次怎麼做」再肯定 1 句。「看更多說明…」展開約 150–180 字的詳細說明（`m`）與精簡出處（`s`，書名＋頁碼），「收起」收回。語氣原則：正向、溫和、具體，不煽情、不說教、不用佛教名相（引文中保留原文）。

**回饋語料擴充（2026-11-18）**：詳細說明改為每種狀況 2–3 則、出自不同老師（`MZ_M`），依紀錄與日期輪替：聖嚴法師《法鼓全集》第四輯；《阿姜查的禪修世界（二）》（蜘蛛網、情緒的家）；帕奧禪師《轉正法輪》《如實知見》（妄念多更要放鬆、灰燼喻、昏沉兩種成因）；馬哈希大師《向馬哈希大師學正念Ⅰ、Ⅱ》（標記「想」「痛」「期待」、換姿勢先知道想換、影相如夢）；比約恩．納提科《我可能錯了》（不相信每個念頭、水瓶呼吸、馬戲團）；焦諦卡禪師《禪修之旅》（旁觀者、安全感、數息五到十）。每則 157–194 字（不含出處），最多一個淺白的比喻或引句，結尾一句「下次可以這樣試」。尚未納入：《10分鐘入禪休息法》（epub 無法讀取），《禪修之旅》《我可能錯了》僅讀前段。

**依時段的回應（2026-11-18）**：依練習開始時間（`x.t`）分為清晨 4–7、上午 7–11、午飯後 11–14、下午 14–17、傍晚 17–21、晚上 21–24、深夜 0–4（`mzPeriod`），在精簡回饋後加一句對應時段的提醒（`MZ_TOD`，涵蓋昏沉、浮躁、念頭、身體、擔心、低落、生氣、安定與一般）。補登的紀錄沒有時間則不加。

## 20. 自適應層（完成「我的節奏」之後）

`myRhythm()` 讀最新一次的測驗結果（作息類型、高峰／低潮／靈感時段、建議番茄長度、核心驅動）。只影響「使用者沒調過」的地方，改過就以使用者為準；靜心提醒不受影響。
- **番茄鐘**：沒設定過時，專注／短休採用建議長度（設定頁標示「依你的節奏」）。
- **每日提醒時間**：早晨意向＝起床後 30 分、第一個番茄＝高峰時段開始、覺察日記＝睡前 1 小時（沒改過的才套用）。
- **今日小語**（今日頁上方一兩句）：依目前時段是否為高峰／低潮／靈感時段給建議，加一句核心驅動的鼓勵（`DRV_DAY`）；深夜提醒收尾。
- **覺察日記回饋**（夜晚回顧下方「看看今天的回饋」）：依心境、情緒、三件事、做到的事、睡眠，加時段（早上定錨／睡前放下／夜型提醒睡眠）與核心驅動的反思句（`DRV_EVE`），最多 6 句。
- **我的頁面**：每日打卡、進度條、計數器、倒數日下方一行回饋，附一句核心驅動的短語（`DRV_SHORT`）。

**核心驅動依據（2026-11-18 核對 Bailey《Intentional》）**：12 個基本價值與定義、兩個方向問題（維持／改變、關注自己／他人）皆與原書一致；依原書「特別留意最強的三個與最弱的三個價值」，核心驅動改為前 3 名（重要支持 2 名、影響有限為後 3 名）。題型採 PVQ 式陳述＋情境題＋兩兩比較＋追問，比原書的直覺排序更接近原書推薦的 PVQ-RR 測驗。
**今日小語時段判斷**：收尾提醒依個人睡眠時間（睡前 90 分鐘內「快到休息時間」，超過睡眠時間 2 小時內「已經過了平常的休息時間」）；晚上非高峰時段用回顧句（`DRV_EVE`），高峰或白天用往前看的句子（`DRV_DAY`）。試跑三種核心驅動與作息（晨型／夜型／中間型），番茄長度、提醒時間、今日小語、日記與頁面回饋皆不同。

## 21. 依時段出現／隱藏（2026-11-18）

原則：不增加設定、不增加操作；固定功能（番茄鐘、小卡片、計時器、提醒）不變，只讓「跟時段有關的提示」在對的時間出現。

**時段依據**（`dayClock()`）：睡覺／起床時間取自「我的節奏」（`myRhythm().sleep/.wake`）；沒做過測驗時用一般成人作息 23:30 睡、07:30 起（`BED_DEF`、`WAKE_DEF`）。
- 晚間（`isEve`）：睡前 4 小時開始，最早 18:00、最晚 22:00，到午夜為止（預設 19:30）。過了午夜，今日頁本身就是新的一天。
- 安靜時段（`quiet`）：睡前 90 分鐘到隔天起床。
- `tick()` 每 30 秒比對 `timeKey()`，時段改變且停在今日／日記頁、沒有正在輸入時才重繪。

**明天的三件事**：晚間在今日頁三件事下方出現一張卡（`tomorrowHTML()`），直接寫進明天那天的 `day(k).j.top3`（資料結構不變，日記也可用日期切換看到）。覺察日記的「夜晚・回顧」裡也有同一份（同步）。前一晚寫的項目帶 `pre:1`，隔天標示「昨晚排好的」。

**沒做完的事**（`carryHTML()`、動作 `t3mv`）：不自動順延，每件給四個選擇：移到明天（主按鈕）／改小一點（輸入更小的一步，順延次數歸零）／放進計畫地圖（有計畫時才出現，存成該計畫的「待辦」筆記）／放下。
- 晚間：在「明天的三件事」卡裡處理今天的；白天：今日頁三件事上方處理昨天還沒處理的（晚間就不再顯示昨天的）。
- 原紀錄保留未完成，加上 `mv`（next/small/plan/drop），完成率照實計算；新項目帶順延次數 `c`，顯示 `↻n`；`c≥3` 時在卡片下方溫和提醒拆小或換時間。目標日三格都滿時提示先清掉一件。
- 回顧：三件事完成率旁顯示「順延 n」；清單用 ✓ / → / ↗ / – 標示結果。

**其他依時段的調整**：
- 小建議卡（含 NEW）在安靜時段不出現（隔天再出現，不消耗額度）。
- 覺察日記：晚間進入時「夜晚・回顧」排到早晨意向之後第一個（一次瀏覽中不跳動）。
- 今日小語（有做測驗者）：收尾時段若明天還沒排三件事，改說「寫下明天的三件事，就可以安心休息了」。

**個人化招呼（評估後不做）**：今日頁已有日期、今日小語（依時段）與小建議卡；再加一行招呼不帶行動、會增加畫面雜訊，且使用者不需要稱呼。

## 22. 讓人看得見「會照你調整」（2026-11-19）

原則：日課安靜地照使用者調整；只在**第一次生效的那天**用一行白話說明（`adaptNote()`，今日小語下方，一天最多一則，記錄在 `sd-adapt`），平常不再提。用詞不說「自適應」「演算法」。
- 番茄長度依「我的節奏」改變時：「番茄鐘換成 35 分鐘了，比較接近你一次能專注的長度。」
- 有開啟的每日提醒套用作息時間時：「每日提醒的時間，也照你平常的作息排好了。」
- 「明天的三件事」出現時間不是預設 19:30 時：「依你平常的睡覺時間，『明天的三件事』會在晚上 9 點後出現。」
介紹卡與每月回顧（之後重整）也照這個語氣。

## 23. 二十四節氣（2026-11-19，試跑）

- 資料 `JQ`：[節氣, 代表植物, 意境, 作息小語]，從小寒開始；植物依使用者指定（立春梅花…大寒梅花）。日期公式 `jqDate()`（21 世紀壽星公式，2025–2027 已核對官方日期，誤差至多一天）。
- 只在**每個節氣開始的前 3 天**出現（`jqNow().n<=2`），位置在今日頁標題下方、今日小語之上（`jqHTML()`），之後回到平常的樣子。開場動畫不放，以免破壞品牌畫面。
- 插畫：`JQ_IMG` 節氣名 → 圖檔。風格：中國傳統歲時、手繪古風、半寫實＋淡水彩、素雅；不用 AI 生成，用公有領域古典圖譜（如《植物名實圖考》《本草圖譜》、十九世紀植物版畫）調成淡雅色調，每張約 40 KB。沒有圖時顯示篆印式的節氣名（`.jqseal`）。
- 取圖需要連 Wikimedia（commons.wikimedia.org、upload.wikimedia.org）：已建立雲端環境「daily-practice」允許這些網址，需在該環境開新的 session 才能使用。

## 24. 介紹卡與回顧卡（2026-11-19，試跑）

主軸：日課會慢慢認識你，陪你找到最佳狀態——平靜地做事，踏實地累積。四個面向：專注、覺察、節奏（會照你調整）、累積。
- **第一次使用**（`WELCOME()`）：歡迎 → 選用途 → 專注 → 覺察 → 節奏 → 資料保存。
- **第 7 天**（`reviewCard()`，id `wk1`）：使用第 7–21 天、近 7 天至少 5 段專注時出現一次：「這一週你專注了 5 小時，多半在上午」，沒做「我的節奏」的引導去做，做過的說明已照作息調整。
- **每月回顧**（id `mon-YYYY-MM`）：每月 1–7 日、上個月至少 6 天有專注時出現一次：專注時數、最常專注的時段、三件事完成率、靜心分鐘，加一個還沒試過的功能。
- 回顧卡跟小建議卡共用位置（同一天只出現一張），優先於一般小建議，安靜時段不出現。
## 25. 目標衝刺的練習計時紀錄（2026-11-19）

不算番茄，但要看得到累積：
- 紀錄存在當天 `day.tests`：`{id, t:開始時間, pid, name, min, segs, of, full}`。
- **跑完一整組**記一筆（`tAdvance` 最後一段結束 → `tRecord(true)`）；**中途重設或換項目**時，若已練習 5 分鐘以上記為「未完成」（`tRecord(false)`），不到 5 分鐘不記。
- 時間照實際計時累積（`T.startedAt`、`T.used`、`T.runAt`；暫停不算、+1 分鐘會算；鎖定畫面的播放、暫停也算），最後一段以排定結束時間為準，App 晚打開不會多算。
- 顯示：目標衝刺頁計時器下方「今天 N 組・分鐘｜本週 N 組」；今日頁標頭一個小標籤（有紀錄才出現，點了到目標衝刺頁）；統計頁一張卡（日：逐筆列出；週／月：依項目分配），名稱跟著情境（測驗計時／訓練計時…）。

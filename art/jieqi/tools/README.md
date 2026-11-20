# 節氣插畫處理腳本

用來重現或調整 `art/jieqi/*.webp`。需要 Python 3、Pillow、numpy、scipy（`pip install pillow numpy scipy`）。

1. 下載來源頁面（Wikimedia Commons 標準縮圖尺寸，請慢慢抓，避免 429）：
   ```bash
   # 梅園草木花譜：卷ID:PDF頁碼
   ./fetch_pages.sh ../../../.jieqi-src 1280 1287281:5 1287281:8 ...
   # 本草圖譜卷40（麥穗）
   VJ=$(pwd)/honzo_vols.json ./fetch_pages.sh ../../../.jieqi-src 1280 1287151:10
   ```
   需要的頁碼都寫在 `build.sh` 每一行的來源檔名裡（`<卷ID>_p<頁碼>.jpg`）。
   下載的圖放在 repo 之外或不要 commit。
2. 產生 24 張 WebP 與預覽：
   ```bash
   ./build.sh <下載資料夾> .. <預覽資料夾>
   ```
3. 產生總覽圖：
   ```bash
   python3 contact.py .. ../contact-sheet.png items.txt /usr/share/fonts/truetype/wqy/wqy-zenhei.ttc
   ```

## `process.py` 主要參數
- `box`：裁切框，以整張跨頁的比例表示 `x0,y0,x1,y1`。
- `--ep`：直接抹成紙色的方框（題字、印章），同樣是頁面比例。
- `--epl`：只抹掉淺色像素的方框（裝訂縫陰影、頁緣），不會傷到植物。
- `--open`：去除細筆畫（書法）的半徑，0 為關閉（白梅這類細枝白花要關）。
- `--nowhite`：不保留比紙更亮的胡粉白。
- `--sat`：保留的飽和度（預設 0.75，即降 25%）。

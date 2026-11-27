# 節日插圖處理腳本

需要 Python 3、Pillow、numpy、scipy。

1. 下載頁面（Commons 限流很嚴，請慢慢抓，`DELAY=40`）：
   `DELAY=40 ./fetch_pages.sh <下載資料夾> 1280 902:14 902:17 ...`
   卷號 902＝卷一、912～915＝卷二～五；需要的頁碼寫在 `build.sh`。
   中秋那頁另抓 1920 寬：`./fetch_pages.sh <暫存> 1920 902:34`，改名成 `902_p034_1920.jpg`。
2. 產生插圖：`./build.sh <下載資料夾> .. <預覽資料夾>`
3. 產生總覽：`python3 contact.py .. ../contact-sheet.png items.txt /usr/share/fonts/truetype/wqy/wqy-zenhei.ttc`

`process.py` 的 `--line` 會把木刻線條轉成暖褐色；其他參數見 `art/jieqi/tools/README.md`。

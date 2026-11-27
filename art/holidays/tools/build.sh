#!/bin/bash
# build.sh <dl-dir> <out-dir> <preview-dir>
# <dl-dir> holds page images named <vol>_p<page>[_1920].jpg fetched from the Commons PDFs below
# (fetch with ./fetch_pages.sh); vol 902 = 卷一, 912..915 = 卷二..五.
set -e
H=$1; O=$2; V=$3; mkdir -p $O $V
P="python3 -I $(dirname $0)/process.py --line --open 0 --nowhite --keep 0.05 --dil 6"
r(){ name=$1; shift; $P "$@" --preview $V/$name.png | sed "s/^/$name: /"; }
r yuandan  $H/902_p014.jpg 0.745,0.355,0.835,0.66 $O/yuandan.webp --nocc --pad 0.18
r chuxi    $H/902_p041.jpg 0.545,0.42,0.845,0.69  $O/chuxi.webp
r chunjie  $H/902_p040.jpg 0.33,0.37,0.445,0.735  $O/chunjie.webp
r yuanxiao $H/902_p017.jpg 0.575,0.42,0.695,0.635 $O/yuanxiao.webp
r heping   $H/915_p036.jpg 0.345,0.185,0.46,0.58  $O/heping.webp --ep 0.432,0.15,0.47,0.33
r ertong   $H/902_p023.jpg 0.665,0.175,0.79,0.37  $O/ertong.webp --ep 0.66,0.17,0.685,0.27
r laodong  $H/913_p024.jpg 0.22,0.22,0.43,0.52    $O/laodong.webp --ep 0.43,0.2,0.5,0.3
r duanwu   $H/902_p027.jpg 0.325,0.22,0.425,0.75  $O/duanwu.webp
r jiaoshi  $H/912_p039.jpg 0.265,0.235,0.435,0.605 $O/jiaoshi.webp --nocc
r zhongqiu $H/902_p034_1920.jpg 0.51,0.466,0.597,0.548 $O/zhongqiu.webp --dil 4
r guoqing  $H/902_p039.jpg 0.675,0.48,0.725,0.85  $O/guoqing.webp --ep 0.722,0.47,0.77,0.55
r guangfu  $H/915_p030.jpg 0.65,0.18,0.83,0.5     $O/guangfu.webp --ep 0.64,0.15,0.672,0.245 0.64,0.225,0.68,0.25 0.64,0.43,0.662,0.52 0.8,0.15,0.86,0.24
r xingxian $H/914_p033.jpg 0.585,0.24,0.75,0.6   $O/xingxian.webp --nocc

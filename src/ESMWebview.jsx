import React, {useEffect, useRef} from "react";
import {esm} from "./esm";
import $ from 'jquery';
import {ESMCategory, ESMDescription, ESMImages, ESMOptions, ESMProduct} from "./product";

const WebViewContainer = () => {
  const esmWrapper = useRef();
  const esmWebview = useRef();

  useEffect(() => {
    window.$ = $;
    esm.init(esmWebview.current);

    // setTimeout(() => esm.loginForce({loginId: 'sohae1672', password: 'ekdnsdlWkd12@'}), 5000);
    // setTimeout(() => esm.searchESMCategory('가방').then(data => console.log(data)), 10000);
    // setTimeout(() => esm.getESMCategoryList(1, 1).then(data => console.log(data)), 15000);

    let images = new ESMImages(["http://image.esmplus.com/t/20200525/17/a70dc9ae29264454.PNG"])
    let category = new ESMCategory('123', '456')
    let description = new ESMDescription('html')
    let options = new ESMOptions()
    let originalPrice = 12000
    let salePrice = 10000
    let quantity = 100
    let maximumBuyForPerson = 1
    let maximumBuyForPersonPeriod = 15
    let startDate = ''
    let endDate = ''
    let product = new ESMProduct("새로운 상품 입니다.", {},{
      category,
      options,
      originalPrice,
      startDate, endDate,
      salePrice,
      quantity,
      images,
      description,
      maximumBuyForPerson,
      maximumBuyForPersonPeriod})
    console.log(product)

  }, [])

  const onTaobaoConfirm = () => {
    // esmWrapper.current.style.zIndex = -2 + 'px';
    // window.document.getElementById('taobao-container').classList.remove('popped')
  }

  return (
    <div ref={esmWrapper}>
      <webview
        ref={esmWebview}
        enableremotemodule="true"
        src='javascript:;'
        style={{width: '100%', height: '500px', overflow: 'hidden', border: '1px solid #aaa'}}
        partition='lastPartition || ("persist:esm2:1111")'
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36"
      ></webview>
    </div >
  )
}

export default WebViewContainer;

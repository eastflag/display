import React, {useEffect, useRef} from "react";
import {esm} from "./esm";

const WebViewContainer = () => {
  const esmWrapper = useRef();
  const esmWebview = useRef();

  useEffect(() => {
    esm.init(esmWebview.current);
    setTimeout(() => esm.loginForce({loginId: 'sohae1672', password: 'ekdnsdlWkd12@'}), 5000);
    setTimeout(() => esm.searchESMCategory({keyword: 'bag'}).then(data => console.log(data)), 15000);

  }, [])

  const onTaobaoConfirm = () => {
    // esmWrapper.current.style.zIndex = -2 + 'px';
    // window.document.getElementById('taobao-container').classList.remove('popped')
  }

  return (
    <div ref={esmWrapper}>
      <webview
        ref={esmWebview}
        enableremotemodule={true}
        src='javascript:;'
        style={{width: '100%', height: '500px', overflow: 'hidden', border: '1px solid #aaa'}}
        partition='lastPartition || ("persist:esm2:1111")'
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36"
      ></webview>
    </div >
  )
}

export default WebViewContainer;

import _ from 'underscore';
import $ from 'jquery';

class ESM {
    constructor(webview, esmData) {
        this.ready = false
        this.$webview = webview

        if (esmData) {
            this.esmData = esmData
        }
    }
    init(webview) {
        this.$webview = webview;
    }
    execute(fn, data) {
        return this.$webview.executeJavaScript(`(${fn.toString()})(${data && JSON.stringify(data)})`)
    }
    async checkAndLoginForce() {
        if (!await this.loginCheck()) {
            console.log('no login')
            return await this.loginForce()
        }
        return true
    }
    async loginForce(data) {
        console.log(this.$webview);
        if (!data) {
            data = this.esmData
        } else {
            this.esmData = data
        }
        await this.$webview.loadURL('https://www.esmplus.com/Member/SignIn/Authenticate',
            {
                httpReferrer: 'https://www.esmplus.com/Member/SignIn/LogOn?ReturnUrl=%2fHome%2fHome',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36',
                extraHeaders: 'Content-Type: application/x-www-form-urlencoded',
                postData:[{
                    type: 'rawData',
                    bytes: Buffer.from(`Id=${data.loginId}&Password=${encodeURIComponent(encodeURIComponent(data.password))}&Type=E&ReturnUrl=%2FHome%2FHome&RememberMe=true&RememberMe=true`)
                }]
            })
        let resultUrl = this.$webview.getURL()
        console.log(resultUrl);

        if (resultUrl.indexOf('LoginThrough') > 0) {
            return true
        }
        return false
    }
    login(data) {
        if (!data) {
            data = this.esmData
        } else {
            this.esmData = data
        }
        return this.execute(({id, pw}) => {
            document.querySelector('#Id').value = id;
            document.querySelector('#Password').value = pw;
            document.querySelector('#btnLogOn').click();
        }, data)
    }
    getUserName() {
        return this.execute(() => {
            return (document.querySelector('.user_name strong') || {}).innerText
        })
    }
    async loginCheck() {
        return new Promise(async (resolve, reject) => {
            try {
                setTimeout(() => {
                    resolve(false)
                }, 15000)

                let data = await this.execute(() => {
                    return new Promise(resolve1 => {
                        $.ajax({
                            type:'GET',
                            url:"/Home/HomeSellerActivityIacData"
                        }).done(resolve1).fail(() => {
                            $.ajax({
                                type:'GET',
                                url:"/Home/HomeSellerActivityIacData"
                            }).done(resolve1).fail(() => {
                                resolve1(false)
                            })
                        })
                    })
                })

                if (data && data.hasOwnProperty('Grade') && data.hasOwnProperty('Credit')) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            } catch (e) {
                resolve(false)
            }
        })
    }
    async searchESMCategory(data) {
        console.log($);
        const {keyword} = data;
        console.log(keyword);

        // await this.checkAndLoginForce()
        let results = await this.execute((keyword) => {
            return window.$.ajax({
                type:'POST',
                url:"/Sell/SingleGoods/GetSearchSDCategory",
                contentType:'application/json',
                data:JSON.stringify(keyword)})
        }, keyword)

        console.log(results);

        for (let result of results) {
            result.name = [result['UpperCategoryName1'],
                result['UpperCategoryName2'],
                result['UpperCategoryName3'],
                result['UpperCategoryName4'],
                result['UpperCategoryName5'],
                result['SDCategoryName']].filter(v => v).join(' > ')
        }
        return results
    }
    async getESMCategoryList(level, code) {
        await this.checkAndLoginForce()

        let {Result:results} = await this.execute(({level, code}) => {
            return $.ajax({
                type:'POST',
                url:"/Sell/SingleGoods/GetSDCategoryList",
                contentType:'application/json',
                data:JSON.stringify({parentCode: code, parentLevel: level})})
        }, {level, code})

        for (let result of results) {
            result.name = [result['UpperCategoryName1'],
                result['UpperCategoryName2'],
                result['UpperCategoryName3'],
                result['UpperCategoryName4'],
                result['UpperCategoryName5'],
                result['SDCategoryName']].filter(v => v).join(' > ')
        }
        return results
    }
    async searchIacGmktCategory(sdCategoryCode) {
        await this.checkAndLoginForce()

        let matchingList = await this.execute(({sdCategoryCode}) => {
            return $.ajax({
                type:'POST',
                url:"/Sell/SingleGoods/GetSDCategoryMatchingList",
                contentType:'application/json',
                data:JSON.stringify({sdCategoryCode})})
        }, {sdCategoryCode})

        let result = {'iac':[], 'gmkt':[]}
        for (let matching of matchingList['Result']) {
            let code

            if (matching['SiteCategoryCode'] == matching['SiteCategoryDCode']) {
                code = matching['SiteCategorySCode']
            } else if (matching['SiteCategoryCode'] == matching['SiteCategorySCode']) {
                code = matching['SiteCategoryMCode']
            } else if (matching['SiteCategoryCode'] == matching['SiteCategoryMCode']) {
                code = matching['SiteCategoryLCode']
            }


            let {Result} = await this.execute(({siteId, code}) => {
                return $.ajax({
                    type:'POST',
                    url:"/Sell/SYI/GetChildSiteCategories",
                    contentType:'application/json',
                    data:JSON.stringify({siteId, code, version: '2.0'})})
            }, {siteId: matching['SiteId'], code})
            let category = Result.find(v => v['CategoryCode'] == matching['SiteCategoryCode'])
            category['name'] = [category['LargeCategory'], category['MiddleCategory'], category['SmallCategory'], category['DetailCategory']].map(c => c && c['Name']).filter(v => v).join(' > ')
            if (matching['SiteId'] == 1) {
                result['iac'].push(category)
            } else if (matching['SiteId'] == 2) {
                result['gmkt'].push(category)
            }
        }
        return result
    }
    async makeGroup(title, siteId, ids) {
        await this.checkAndLoginForce()

        let {GroupInfo} = await this.execute(({siteId, siteGoodsNo}) => {
            return $.ajax({
                type:'POST',
                url:"/Sell/GroupGoods/GetNewGroupGoodsInfo",
                contentType:'application/json',
                data:JSON.stringify({siteId, siteGoodsNo})})
        }, {siteId, siteGoodsNo: ids[0]})

        if (GroupInfo) {
            _.extendOwn(GroupInfo, {
                "GroupName": title,
                "SiteGoodsNoInGroup": ids,
                "IntroImageUrl": "",
                "ExposeType": "0",
                "SearchWord": "",
                "GoodsIds": "",
                "SearchStatusCode": "0",
                "PageSize": "30",
                "PageIdx": 1,
                "SortType": "1"
            })

            return await this.execute(({GroupInfo}) => {
                let fd = new FormData();
                fd.append( 'paramsData', JSON.stringify(GroupInfo));

                return $.ajax({
                    url: '/Sell/GroupGoods/SetNewGroupGoods',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST'
                });
            }, {GroupInfo})
        }
    }
    async createNewProduct(model) {
        await this.checkAndLoginForce()

        let responseBody = await this.execute(({model}) => {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type:'POST',
                    url:"/Sell/SingleGoods/Save",
                    contentType:'application/json',
                    data:JSON.stringify({model})})
                    .done(resolve)
                    .fail(() => {
                        setTimeout(() => {
                            $.ajax({
                                type:'POST',
                                url:"/Sell/SingleGoods/Save",
                                contentType:'application/json',
                                data:JSON.stringify({model})})
                                .done(resolve)
                                .fail((e) => {
                                    reject(JSON.stringify(e))
                                })
                        }, 500)
                    })
            })
        }, {model})

        let response = {}
        if (responseBody['Unknown']) {
            console.log('response', responseBody)
            response['error'] = '오류가 발생했습니다.'
            if (responseBody['Unknown']['ErrorList'] && responseBody['Unknown']['ErrorList'][0]) {
                response['error'] = responseBody['Unknown']['ErrorList'][0]['ErrorMessage']
            }
            return response
        }

        let trs = responseBody.replace(/[\r\n]/g, '').match(/<tr(.+?)<\/tr>/g)
        if (trs) {
            try {
                let result = trs.find(v => v.match(/<th.*auction.*<\/th>/)).match(/<td.*?>.*?<span.*?>(.*?)<\/span>/)[1].trim()
                console.log(result)
                if (result) {
                    if (result.match(/^[a-zA-Z0-9]+$/)) {
                        response['iacId'] = result
                    } else {
                        response['iacMessage'] = result
                    }
                }
            } catch (e) {
            }

            try {
                let result = trs.find(v => v.match(/<th.*gmarket.*<\/th>/)).match(/<td.*?>.*?<span.*?>(.*?)<\/span>/)[1].trim()
                if (result) {
                    if (result.match(/^[a-zA-Z0-9]+$/)) {
                        response['gmktId'] = result
                    } else {
                        response['gmktMessage'] = result
                    }
                }
            } catch (e) {
            }
            try {
                let result = trs.find(v => v.match(/<th.*마스터.*<\/th>/)).match(/<td.*?>.*?<span.*?>(.*?)<\/span>/)[1].trim()
                if (result) {
                    if (result.match(/^[a-zA-Z0-9]+$/)) {
                        response['masterId'] = result
                    } else {
                        response['masterMessage'] = result
                    }
                }
            } catch (e) {
            }
            try {
                let result = trs.find(v => v.match(/<th.*오류.*<\/th>/)).split('<td')[1].match(/<div.+?>(.*)<\/div>/)[1].trim()
                if (result) {
                    response['error'] = result
                }
            } catch (e) {
            }
        }
        return response
    }
    async getAvailableOption(request) {
        return await this.execute(({request}) => {
            return $.ajax({
                type:'POST',
                url:request['IAC'] ? "/sell/popup/GetTotalObjectivityOptionClauseBycategoryCode": "/sell/popup/GetObjectivityOptionClauseBycategoryCode",
                contentType:'application/json',
                data:JSON.stringify(request)})
        }, {request})
    }
    async removeGroups(groups) {
        await this.checkAndLoginForce()

        return await this.execute(({groups}) => {
            return $.ajax({
                type:'POST',
                url:'/Sell/GroupGoods/RemoveGroupInfo',
                contentType:'application/json',
                data:JSON.stringify(groups)})
        }, {groups})
    }
    async deleteByMasterIds(masterIds) {
        await this.checkAndLoginForce()

        return new Promise(async (resolve, reject) => {
            try {
                for (let i = 0; i < 10; i++) {
                    let {data: searchResults} = await this.searchProducts(masterIds)
                    if (searchResults.length > 0) {
                        if (searchResults.find(r => r['StatusCodeIAC'] == '11' || r['StatusCodeGMKT'] == '11')) {
                            let param = await this.makeChangeProductParam(searchResults, {siteType: 'sale'})
                            await this.changeProduct('SellStateChangeStop', param)
                        } else {
                            let param = await this.makeChangeProductParam(searchResults, {siteType: 'stop'})
                            await this.changeProduct('SellStateDelete', param)
                            resolve()
                            return
                        }
                    } else if (i > 8) {
                        resolve()
                        return
                    }

                    await new Promise((resolve) => setTimeout(() => {resolve()}, 5000))
                }
                reject()
            } catch(e) {
                reject()
            }
        })
    }
    async makeChangeProductParam(searchResults, filter) {
        let result = {param:[], siteType:"0"}
        let statusCodes = []
        for (let r of searchResults) {
            let param = {
                "SingleGoodsNo":r['SingleGoodsNo'],
                "ShowIAC":r['SiteGoodsNoIAC'] ? true: false,
                "ShowGMKT":r['SiteGoodsNoGMKT'] ? true: false,
                "popupParamModel":[]
            }

            let statusCode = {}
            if (r['SiteGoodsNoIAC']) {
                param.popupParamModel.push({
                    "SiteId": 1,
                    "GoodsNo": r['SingleGoodsNo'],
                    "SiteGoodsNo": r['SiteGoodsNoIAC'],
                    "SellerCustNo": r['SellerCustNoIAC'],
                    "SellerId": r['SellerIdIAC'],
                    "ItemName": r['GoodsName'],
                    "SellType": r['SellType'],
                    "SellPrice": r['SellPriceIAC'],
                    "StockQty": r['StockQtyIAC'],
                    "DispEndDate": new Date(r['DispEndDate'].match(/\d+/)[0] * 1).toISOString(),
                    "SiteCategoryCode": r['CategoryCodeIAC'],
                    "DistrType": r['DistrType'],
                    "GroupNo": r['GroupNoIAC'],
                    "StatusCode": r['StatusCodeIAC']
                })
                statusCode['iac'] = r['StatusCodeIAC']
            }

            if (r['SiteGoodsNoGMKT']) {
                param.popupParamModel.push({
                    "SiteId": 2,
                    "GoodsNo": r['SingleGoodsNo'],
                    "SiteGoodsNo": r['SiteGoodsNoGMKT'],
                    "SellerCustNo": r['SellerCustNoGMKT'],
                    "SellerId": r['SellerIdGMKT'],
                    "ItemName": r['GoodsName'],
                    "SellType": r['SellType'],
                    "SellPrice": r['SellPriceGMKT'],
                    "StockQty": r['StockQtyGMKT'],
                    "DispEndDate": new Date(r['DispEndDate'].match(/\d+/)[0] * 1).toISOString(),
                    "SiteCategoryCode": r['CategoryCodeGMKT'],
                    "DistrType": r['DistrType'],
                    "GroupNo": r['GroupNoGMKT'],
                    "StatusCode": r['StatusCodeGMKT']
                })

                statusCode['gmkt'] = r['StatusCodeGMKT']
                statusCodes.push(statusCode)
            }

            result['param'].push(param)
        }

        for (let statusCode of statusCodes) {
            if (filter['siteType'] == 'sale') {
                if (statusCode['iac'] == '11' && statusCode['gmkt'] == '11') {
                    result['siteType'] = '0'
                    break
                } else if (statusCode['iac'] == '11') {
                    result['siteType'] = '1'
                    break
                } else if (statusCode['gmkt'] == '11') {
                    result['siteType'] = '2'
                    break
                }
            } else if (filter['siteType'] == 'stop') {
                if (statusCode['iac'] == '21' && statusCode['gmkt'] == '21') {
                    result['siteType'] = '0'
                    break
                } else if (statusCode['iac'] == '21') {
                    result['siteType'] = '1'
                    break
                } else if (statusCode['gmkt'] == '21') {
                    result['siteType'] = '2'
                    break
                }
            }
        }

        return result

    }
    async changeProduct(action, param) {
        await this.checkAndLoginForce()

        let url = ''

        switch (action) {
            case 'SellStateChangeStart': url = '/Sell/SingleGoodsMng/SetSellStateChangeStart'; break;	//판매시작
            case 'SellStateChangeStop': url = '/Sell/SingleGoodsMng/SetSellStateChangeStop'; break;		//판매중지
            case 'PeriodSetting': url = '/Sell/SingleGoodsMng/SetPeriodExtend'; break;	//판매기간 연장
            case 'SellerDiscount': url = '/Sell/SingleGoodsMng/SetSellerDiscount'; break;	//판매자부담할인
            case 'SellerDiscountRow': url = '/Sell/SingleGoodsMng/SetSellerDiscount'; break;	//판매자부담할인 개별설정
            case 'StockSetting': url = '/Sell/SingleGoodsMng/SetStockQty'; break;	//재고설정
            case 'DeliveryFeeAddService': url = '/Sell/SingleGoodsMng/SetDeliveryFeeAddService'; break; //배송정보변경 n개
            case 'DeliveryFeeUpdateService': url = '/Sell/SingleGoodsMng/SetDeliveryFeeUpdateService'; break; //배송정보변경 1개
            case 'ShopCategoryMatching': url = '/Sell/SingleGoodsMng/SetShopCategoryMatching'; break;	//Shop 카테고리 연결
            case 'AdditionalService': url = '/Sell/SingleGoodsMng/SetAddService'; break; //부가서비스설정
            case 'SellStateDelete': url = '/Sell/SingleGoodsMng/SetSellStateDelete'; break;	//상품삭제
            case 'ImageModify': url = '/Sell/SingleGoodsMng/SetImageModify'; break;
            case 'TransPolicySingle': url = '/Sell/SingleGoodsMng/SetSingleGoodsTransPolicy'; break;
            case 'SellerFunding': url = '/Sell/SingleGoodsMng/SetGoodsSellerFunding'; break;
        }

        return this.execute(({url, param}) => {
            return $.ajax({
                type: 'POST',
                url: url,
                contentType: 'application/json;charset=utf-8',
                data: JSON.stringify(param),
                dataType: 'json'
            })
        }, {url, param})
    }
    async getOptionValues(optionNo) {
        return await this.execute(({optionNo}) => {
            return $.ajax({
                type:'POST',
                url:'/sell/popup/GetObjectivityOptionEssenOfSingleGoodsByObjOptNo',
                contentType:'application/json',
                data:JSON.stringify({keyWord: null, objOptNo: optionNo})})
        }, {optionNo})
    }
    async searchProducts(productIds) {
        await this.checkAndLoginForce()

        return await this.execute(({productIds}) => {
            let fd = new FormData();
            let data = {"Keyword":"","SiteId":"0","CategorySiteId":-1,"CategoryCode":"","CategoryLevel":"","TransPolicyNo":0,"StatusCode":"","SearchDateType":0,"SearchStartDate":"","SearchEndDate":"","SellerId":"","SellerSiteId":"","StockQty":-1,"SellPeriod":0,"DiscountUseIs":-1,"DeliveryFeeApplyType":0,"OptAddDeliveryType":0,"OptSelUseIs":-1,"PremiumEnd":0,"PremiumPlusEnd":0,"FocusEnd":0,"FocusPlusEnd":0,"GoodsIdType":"S",
                "GoodsIds":productIds.join(','),
                "ShopCateReg":-1,"IsTPLUse":"","SellMinPrice":0,"SellMaxPrice":0,"OrderByType":11,"GroupOrderByType":1,"IsGroupUse":"","IsApplyEpin":"","IsConvertSingleGoods":""}
            fd.append( 'paramsData', JSON.stringify(data));
            fd.append('page', '1')
            fd.append('start', '0')
            fd.append('limit', '500')

            return $.ajax({
                url: '/Sell/SingleGoodsMng/GetSingleGoodsList?_dc=' + (+new Date),
                data: fd,
                processData: false,
                contentType: false,
                type: 'POST'
            });
        }, {productIds})
    }
    async getDeliveryFeeTemplateNo(shipmentPlaceNo, price = 0, isFree = false) {
        await this.checkAndLoginForce()

        let foundTemplate = async () => {
            let templates = await this.execute(({shipmentPlaceNo}) => {
                return $.ajax({type:'get', url:'/SELL/SYI/GetDeliveryFeeTemplates?shipmentPlaceNo=' + shipmentPlaceNo})
            }, {shipmentPlaceNo})
            if (templates) {
                let template = templates.find(t => {
                    if (isFree) {
                        if (t['DeliveryFeeType'] == 1) {
                            return true
                        }
                    } else {
                        if (t['DeliveryFeeType'] == 2 && parseInt(t['FeeAmnt']) == parseInt(price)) {
                            return true
                        }
                    }
                    return false
                })
                return template
            }
        }
        let found = await foundTemplate()
        if (!found) {
            let deliveryFeeType = isFree ? 1 : 2
            let feeAmount = isFree ? 0 : price
            await this.execute(({shipmentPlaceNo, deliveryFeeType, feeAmount}) => {
                return $.ajax({
                    type:'POST',
                    url:"/Sell/Popup/RegisterDeliveryFeeTemplateAdd",
                    data: `DeliveryFeeTemplateJSON=%7B%22DeliveryFeeType%22%3A${deliveryFeeType}%2C+%22DeliveryFeeSubType%22%3A0%2C+%22FeeAmnt%22%3A${feeAmount}%2C+%22PrepayIs%22%3Atrue%2C+%22CodIs%22%3Afalse%2C+%22JejuAddDeliveryFee%22%3A0%2C+%22BackwoodsAddDeliveryFee%22%3A0%2C+%22ShipmentPlaceNo%22%3A${shipmentPlaceNo}%2C+%22DetailList%22%3A%5B%5D%7D&IsDefaultTemplate=false`
                })
            }, {shipmentPlaceNo, deliveryFeeType, feeAmount})

            found = await foundTemplate()
        }

        return found
    }
    op() {
        document.querySelectorAll('.syi_content').forEach(i => i.style.display='none');
        document.querySelectorAll('.syi_content')[0].style.display='block';
        document.querySelectorAll('.syi_content')[1].style.display='block';
        document.querySelectorAll('tr.item').forEach(i => i.style.display='none');
        document.querySelector('.syi_menu_control').style.display = 'none'
        document.querySelector('.header').style.display = 'none'
        document.querySelector('.syi_menu_wrap').style.display = 'none'
        document.querySelector('tr.item.item_use-market').style.display = ''
        document.querySelector('tr.item.item_goods-deliveryinfo').style.display = ''
    }
}

const esm = new ESM();
export {esm}

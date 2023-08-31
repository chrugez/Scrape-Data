const scrapeCategory = (browser, url) => new Promise(async (resolve, reject) => {
    try {
        let page = await browser.newPage()
        console.log('>> Mở tab mới');
        await page.goto(url)
        console.log('>> Truy cập vào ' + url);
        await page.waitForSelector('#webpage')
        console.log('>> Website đã load xong...');

        const dataCategory = await page.$$eval('#navbar-menu > ul > li', els => {
            dataCategory = els.map(el => {
                return {
                    category: el.querySelector('a').innerText,
                    link: el.querySelector('a').href,
                }
            })
            return dataCategory
        })
        // console.log(dataCategory);

        await page.close()
        console.log('>> Tab đã đóng.');
        resolve(dataCategory)
    } catch (error) {
        console.log('Lỗi ở scrape category: ' + error);
        reject(error)
    }
})

const scraper = (browser, url) => new Promise(async (resolve, reject) => {
    try {
        let newPage = await browser.newPage()
        console.log('>> Đã mở tab mới');
        await newPage.goto(url)
        console.log('>> Đã Truy cập vào trang ' + url);
        await newPage.waitForSelector('#main')
        console.log('>> Đã load xong tag main...');

        const scrapeData = {}

        //lấy header
        const headerData = await newPage.$eval('header', (el) => {
            return {
                title: el.querySelector('h1').innerText,
                description: el.querySelector('p').innerText,
            }
        })

        // console.log(headerData);
        scrapeData.header = headerData

        //lấy links detail item
        const detailLinks = await newPage.$$eval('#left-col > section.section-post-listing > ul > li', (els) => {
            detailLinks = els.map(el => {
                return el.querySelector('.post-meta > h3 > a').href
            })
            return detailLinks
        })


        // console.log(detailLinks);
        const scraperDetail = async (link) => new Promise(async (resolve, reject) => {
            try {
                let pageDetail = await browser.newPage()
                await pageDetail.goto(link)
                console.log('>> truy cập ' + link);
                await pageDetail.waitForSelector('#main')

                const detailData = {}
                //bắt đầu cào data
                //cào ảnh
                const images = await pageDetail.$$eval('#left-col > article > div.post-images > div > div.swiper-wrapper > div.swiper-slide', (els) => {
                    images = els.map(el => {
                        return el.querySelector('img')?.src
                    })
                    return images.filter(i => !i === false)
                })

                // console.log(images);
                detailData.images = images

                //lấy header deatail
                const header = await pageDetail.$eval('header.page-header', (el) => {
                    return {
                        title: el.querySelector('h1 > a').innerText,
                        star: el.querySelector('h1 > span')?.className?.replace(/^\D+/g, ''),
                        class: {
                            content: el.querySelector('p').innerText,
                            classType: el.querySelector('p > a > strong').innerText
                        },
                        address: el.querySelector('address').innerText,
                        attributes: {
                            price: el.querySelector('div.post-attributes > .price > span').innerText,
                            acreage: el.querySelector('div.post-attributes > .acreage > span').innerText,
                            published: el.querySelector('div.post-attributes > .published > span').innerText,
                            hashtag: el.querySelector('div.post-attributes > .hashtag > span').innerText,
                        }
                    }
                })
                // console.log(header);
                detailData.header = header

                //thông tin mô tả
                const mainContentHeader = await pageDetail
                    .$eval('#left-col > article.the-post > section.post-main-content', (el) => el.querySelector('div.section-header > h2').innerText)
                const mainContentContent = await pageDetail
                    .$$eval('#left-col > article.the-post > section.post-main-content > .section-content > p', (els) => mainContentContent = els.map(el => el.innerText))

                // console.log(mainContentHeader);
                // console.log(mainContentContent);
                detailData.mainContent = {
                    header: mainContentHeader,
                    content: mainContentContent
                }

                //Đặc điểm tin đăng
                const overviewHeader = await pageDetail
                    .$eval('#left-col > article.the-post > section.post-overview', (el) => el.querySelector('div.section-header > h3').innerText)
                const overviewContent = await pageDetail
                    .$$eval('#left-col > article.the-post > section.post-overview > .section-content > table.table > tbody > tr', (els) => {
                        return els.map(el => {
                            return {
                                name: el.querySelector('td:first-child').innerText,
                                content: el.querySelector('td:last-child').innerText,
                            }
                        })
                    })

                // console.log(overviewHeader);
                // console.log(overviewContent);
                detailData.overview = {
                    header: overviewHeader,
                    content: overviewContent
                }

                //Thông tin liên hệ
                const contactHeader = await pageDetail
                    .$eval('#left-col > article.the-post > section.post-contact', (el) => el.querySelector('div.section-header > h3').innerText)
                const contactContent = await pageDetail
                    .$$eval('#left-col > article.the-post > section.post-contact > .section-content > table.table > tbody > tr', (els) => {
                        return els.map(el => {
                            return {
                                name: el.querySelector('td:first-child').innerText,
                                content: el.querySelector('td:last-child').innerText,
                            }
                        })
                    })

                // console.log(contactHeader);
                // console.log(contactContent);
                detailData.contact = {
                    header: contactHeader,
                    content: contactContent
                }

                await pageDetail.close()
                resolve(detailData)
                console.log('>> Đã đóng tab ' + link);
            } catch (error) {
                console.log('Lấy data detail lỗi: ' + error);
                reject(error)
            }
        })

        const details = []
        for (let link of detailLinks) {
            const detail = await scraperDetail(link)
            details.push(detail)
        }

        scrapeData.body = details


        console.log('>> Trình duyệt đã đóng.');
        resolve(scrapeData)
    } catch (error) {
        console.log('Lỗi ở scraper: ' + error);
        reject(error)
    }
})

module.exports = {
    scrapeCategory,
    scraper
}
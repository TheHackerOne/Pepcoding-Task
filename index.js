
// List of Modules used in this project
import puppeteer from 'puppeteer'
import cheerio from 'cheerio'
import request from 'request'
import chalk from 'chalk'
import figlet from 'figlet'


// (IIFE) Immediately-invoked Function Expression that gets executed as soon as they are created
(async function(){
    try {
        // Instantiating a Browser Instance
        let browserInstance = await puppeteer.launch({
            headless: false,
            args: ['--start-maximized'],
            defaultViewport: null,
        })

        // Automating all the Button/Link clicks so that we can reach the intended webpage
        let newTab = await browserInstance.newPage()
        await newTab.goto('https://www.wikipedia.org')
        await newTab.click("#js-link-box-en")
        await waitAndClick('a[href="/wiki/Wikipedia:Contents/Portals"]', newTab)
        await waitAndClick('a[href="/wiki/Wikipedia:Contents/A%E2%80%93Z_index"]', newTab)
        await waitAndClick('a[title="Special:AllPages/Y"]', newTab)
        await waitAndClick('a[title="Y"]', newTab)

        // Extracting the URL of the current Page
        const url = newTab.url()

        // Calling the Request function to scrape all Info From the passed URL
        request(url, callBackForRequest)

    } catch (error) {
        console.log(error)
    }
})()

// waitAndClick Function allows the page to load until the passed Selector is loaded/added to the page
async function waitAndClick(selector, cPage){
    await cPage.waitForSelector(selector)

    let selectorClicked = cPage.click(selector)
    return selectorClicked
}

// Callback function for request function call
function callBackForRequest(err, request, html){
    if(err){
        console.log(err)
    }else{
        extractInfoInHeadings(html);
        console.log(chalk.green("Thank You !!"))
    }
}

// Displays the Heading using CHALK and FIGLET modules
function displayHeading(heading){
    console.log(chalk.rgb(90, 255, 8).bold(figlet.textSync(`${heading}`)))
}

// Scrape first 3 headings(their subheadings too) from the webPage
function extractFirstThreeHeadings(arr){
    let nums = [1, 2, 3]
    arr = arr.filter((ele) => ele.length != 0)
    .filter((ele)=> nums.includes(parseInt(ele[0])))
    .map((ele, idx) => {
        ele = ele.split(" ")
        ele.shift()
        return ele.join(" ")
    })
    return arr
}

// Extracts Information related to each Heading from the Webpage
function extractInformationFromHeading($, heading, wholePage, headingRange, html){
    if(heading.includes('Confusion')){
        heading = heading.split(" ")
        heading = heading.slice(0, 3).join(" ")
    }
    displayHeading(heading)
    let paras = $(wholePage).find('p')
    let ui = $(wholePage).find('ul')
    let validParas = [], validUi = []
    
    let headingIdx = [];
    for(let i = headingRange[0]; i<=headingRange[1];i++){
        headingIdx.push(i);
    }

    if(heading == 'Pronunciation and use'){
        displayTable(html)
    }else if(heading == 'English'){
        for(let i=0;i<paras.length;i++){
            if(headingIdx.includes(i)){
                validParas.push($(paras[i]).text())
            }
        }
        for(let i=0;i<ui.length;i++){
            if(i >= 12 && i <= 17){
                validUi.push($(ui[i]).text())
            }
        }
        let i = 0;
        while(i < 6){
            console.log(validParas[i])
            validUi[i].split('\n').forEach((ele, idx) => {
                console.log("\t*", ele, '\n\n')
            })
            i++
        }
        console.log("\t*",validParas[i++])
        console.log("\t*", validParas[i], '\n\n')
        return;
    }
    for(let i=0;i<paras.length;i++){
        if(headingIdx.includes(i)){
            console.log($(paras[i]).text())
        }
    }

    for(let i=0;i<2;i++){
        console.log("\n")
    }
}

// Extract Table and Displays it on the console
function displayTable(html){
    let $ = cheerio.load(html)
    let table = $('.wikitable')

    let tableHeadings = []
    let arr = $(table).find('th').text()
    tableHeadings = arr.split('\n').slice(3, 7)

    let tableCol1 = $(table).find('th[colspan="2"]').text().split('\n').slice(0, 22).map((ele) => {
        let diff = 15 - ele.length
        let str = ''
        for(let i=0;i<diff;i++) str += ' '
        return (ele + str)
    })

    let tableCol2 = $(table).find('span[class="IPA nowrap"]').text().slice(1, 130).split('//').map((ele, idx) => `\\${ele}\\`).slice(0, 22)
    let tableCol3 = $(table).find('td').text().split('\n').filter((ele) => ele.length !== 0 && ele[0] != '/').slice(6, 28);

    console.log(tableHeadings[0] + '\t\t' + tableHeadings[1] + '\t\t' + tableHeadings[2]+ '\t\t\t' + tableHeadings[3])

    for(let i=0;i<22;i++){
        let str1 = tableCol1[i], str2 = tableCol2[i], str3 = tableCol3[i]
        let strRow = str1 + '\t\t\t' + str2 + '\t\t\t' + str3 
        console.log(strRow)
    }
}

// Helps to extract information from each heading
function extractInfoInHeadings(html){
    let $ = cheerio.load(html)
    let headingBox = $('.toc');
    let wholePage = $('.mw-parser-output')

    let arr = $(headingBox[0]).contents().text().split('\n')
    
    let headingList = extractFirstThreeHeadings(arr)

    let headingIdx = [[2, 4], [5, 6], [7,11], [12, 12], [13, 13],[], [15,22], [23, 45], [46, 47]]
    for(let i = 0; i < 9; i++){
        extractInformationFromHeading($, headingList[i], wholePage, headingIdx[i], html)
    }
}
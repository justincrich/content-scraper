const json2csv = require('json2csv');
const scrapeIt = require("scrape-it");
const fs = require('fs');
const http = require('http');

/*UC 1: check if ./data exists ...
if not create the folder*/
 fs.readdir('./data',(err,files)=>{
   if(err){
     fs.mkdir('./data',(res)=>{
       scrape();
     });
   }else{
     scrape();
   }
 });


/*UC 2:
The scraper should get the price, title,
url and image url from the product page

price:

*/

 function scrape(){
   let output = [];
   // Promise interface
  scrapeIt("http://www.shirts4mike.com/shirts.php", {
      shirts:{
        listItem:'.products li',
        data:{
          url:{
            selector:"a",
            attr:'href'
          }
        }

      }
  }).then(page => {
      let arr = page['shirts'];
      //iterate through arr
      let process = new Promise((res,rej)=>{
        arr.forEach((item,index,forEachArr)=>{
          scrapeIt('http://www.shirts4mike.com/'+item['url'],{
            title:'.shirt-details h1',
            price:'.price',
            imgURL:{
              selector:'.shirt-picture img',
              attr:'src'
            }
          }).then(res1=>{

            //adjust the title to remove the price
            res1.title = res1.title.slice(res1.price.length+1);
            //alter URL/img url to include domain
            res1.imgURL = 'http://www.shirts4mike.com/'+res1.imgURL;
            res1.url = 'http://www.shirts4mike.com/'+item['url'];
            res1.time = new Date();
            output.push(res1);
            //return result if we are done, we are done when we've received
            //outputs for the same amount of items that we are requesting
            if(output.length == forEachArr.length){
              res(output);
            }
          }).catch(e=>{

            if(e.code === 'ENOTFOUND'){
              console.log('There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.')
            }
          });


        });
      });
      process.then(out =>{
        console.log(out);
        let csv = json2csv({data:out,fieldNames:['Title','Price','Image URL','URL','Time']})
        fs.readdir('./data',(err,files)=>{
          //if no file add new file
          let date = new Date();
          let fileAddress = ''+date.getFullYear()+'-'+(date.getUTCMonth()+1)+'-'+date.getUTCDate()+'.csv';
          console.log(fileAddress,files)
          if(files.includes(fileAddress)){
            //replace text in file if the file exists
            writeFile(csv);
          }else{
            //add file only if no files exist OR if the folder doesn't have the file name
            addFile(csv);

          }
        })
      })
  }).catch(e=>{

    if(e.code === 'ENOTFOUND'){
      console.log('There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.')
    }
  });

  function addFile(data){
    let date = new Date();
    let path = './data/'+date.getFullYear()+'-'+(date.getUTCMonth()+1)+'-'+date.getUTCDate()+'.csv';
    fs.writeFile(path,data,err=>{
      if (err) throw err;
      console.log('Saved new file to '+path);
    });
  }

  function writeFile(data){
    let date = new Date();
    let path = './data/'+date.getFullYear()+'-'+(date.getUTCMonth()+1)+'-'+date.getUTCDate()+'.csv';
    let wstream = fs.createWriteStream(path);
    wstream.write(data);
    wstream.end();
    console.log('Updated data at '+ path)
  }

 }

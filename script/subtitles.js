'use strict';

class Subtitles {
    
    constructor(url, id){  
        this.id = id;
        this.row = [];

        let xhr = new XMLHttpRequest();
        xhr.addEventListener('readystatechange', () => {
            if(xhr.readyState == xhr.DONE){
                if(xhr.status == 200){
                    this.row = this.parse_srt(xhr.response);

                    console.log("subs loaded: " + url);
                    console.log(this.row); 
                }
                if(xhr.status == 404){throw("subtitles not found");}                    
            }   
        });    
        xhr.open('GET', url);
        xhr.responseType = 'text';
        xhr.send();
    }

    get_id(){
        return this.id;
    }
    
    get(time){        
        if(this.row == null){return null;}
        time *= 1000;

        for(let i = 0; i < this.row.length; i++){
            if(time <= this.row[i].end && time >= this.row[i].start){
                return this.row[i].text;
            }
        }
        return null;
    }

    parse_srt(data){
        let sub = [];

        data = data.split(/(?:\r\n|\n|\r)/gm);
        
        for(let i = 0; i < data.length-1; i++){
            let obj = {};
            obj.id = parseInt(data[i]);
            
            let time = data[++i].split(/\s*-->\s*/g);
            obj.start = this.format_time(time[0]);
            obj.end = this.format_time(time[1]);

            let count = 0;
            obj.text = "";
            while(!data[++i].match(/^\s*$/gm)){
                if(count > 0){obj.text += "<br>";}
                obj.text += data[i];
                count++;
            }

            sub.push(obj);
        }

        return sub;
    }

    format_time(data){
        let t1 = data.split(':');
        let t2 = t1[2].split(',');
        return (parseInt(t1[0])*3600 + parseInt(t1[1])*60 + parseInt(t2[0]))*1000 + parseInt(t2[1]);
    }
}
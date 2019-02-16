'use strict';

const MEDIA_ROOT = "media/";

class Player {

    constructor(input, div, autoplay){
        if(div == null){throw "div not found";}

        this.div = div;
        this.video = null;
        this.controls = null;
        this.ms = null;
        this.manifest = null;
        this.dl = {};
        this.updating = false;
        this.subtitles = null;
        this.available_subtitles = input.subtitles;

        this.average_dl = 0;
        this.average_data = [0,0,0,0,0];
        this.average_count = 0;

        this.create(input.preview, autoplay);
        this.get_manifest(MEDIA_ROOT + input.manifest);

        document.title = input.name;
        this.info = input;//gör den mindre???
    }

    create(preview, autoplay){
        this.video = document.createElement('video');
        this.div.appendChild(this.video);

        this.video.addEventListener('timeupdate', () => this.update(this.video.currentTime));
        this.video.addEventListener('ended', () => this.playback_end());
        this.video.addEventListener('play', () => this.playback());
        this.video.addEventListener('pause', () => this.playback_stop());

        this.controls = new Controls(this, preview);
        this.controls.set_fullscreen(this.div);
        if(autoplay){this.controls.play();}
    }

    source(){
		this.ms = new MediaSource();
        this.ms.addEventListener('sourceopen', () => this.get_metadata());
        this.video.addEventListener('loadedmetadata', () => {
            this.controls.set_duration();
            this.download(0);
        });
		this.video.src = URL.createObjectURL(this.ms);
    }

    get_metadata(){
        if(this.video.readyState != 0){return;}//don't load init segment again after endOfStream() is called
		this.buffer = this.ms.addSourceBuffer(this.manifest.codec);

        let xhr = new XMLHttpRequest();    
        xhr.addEventListener('readystatechange', () => {
			if(xhr.readyState == xhr.DONE){
				
				if(xhr.status == 200 || xhr.status == 206){
					this.buffer.appendBuffer(xhr.response);
					return;
				}
				
				if(xhr.status == 404){
                    this.controls.error("content not found");
                    throw("content not found");
                }    
            } 
        });
        xhr.open('GET', this.manifest.file);
        xhr.setRequestHeader('Range', 'bytes=' + this.manifest.init);
        xhr.responseType = 'arraybuffer';
        xhr.send();
    }

    get_manifest(url){
		let xhr = new XMLHttpRequest();    
		xhr.addEventListener('readystatechange', () => {
			if(xhr.readyState == xhr.DONE){ 	

                if(xhr.status == 200){    
                    console.log(xhr);
                    let segments = [];
					for(let data of Array.from(xhr.responseXML.getElementsByTagName('SegmentURL'))){
						segments.push(data.getAttribute("mediaRange"));
					}

					this.manifest = {
						"file":MEDIA_ROOT+xhr.responseXML.getElementsByTagName('BaseURL')[0].innerHTML,
                        "codec":xhr.responseXML.getElementsByTagName('Representation')[0].getAttribute('mimeType') + '; codecs="' + xhr.responseXML.getElementsByTagName('Representation')[0].getAttribute('codecs') + '"',
						"init":xhr.responseXML.getElementsByTagName('Initialization')[0].getAttribute("range"),
						"segments":segments,
                        "segment_duration":xhr.responseXML.getElementsByTagName('SegmentList')[0].getAttribute('duration') / 1000,
                        "segment_parts":segments.length
					};

					this.source();
					return;
				}

				if(xhr.status == 404){
                    this.controls.error("manifest not found");
                    throw("manifest not found");
                }
			}
		});
		xhr.open('GET', url);
        xhr.responseType = 'document';
        xhr.send();
    }
    
    download(index){
        if(this.dl[index] != null){console.log("download in progress"); return;}
        if(index >= this.manifest.segment_parts){this.updating = false; return;}

        let item = {xhr:null, index: index, status:false, dl_start:null};
        this.dl[index] = item;

        item.xhr = new XMLHttpRequest();
        item.xhr.addEventListener('readystatechange', () => {

            if(item.xhr.readyState == item.xhr.OPENED){
                item.dl_start = +new Date();
                return;
            }

            if(item.xhr.readyState == item.xhr.DONE){
				
				if(item.xhr.status == 200 || item.xhr.status == 206){
					if(this.buffer.updating){
						throw("ERROR: buffer not completed");
					}
					
					let average = (+new Date()) - item.dl_start;
					this.controls.__test_set_dl_time(average);
					this.average_dl_time(average);

					this.buffer.appendBuffer(item.xhr.response);
					this.buffer.onupdateend = () => {
						console.log("buffer updated");

						this.loading(false);

						if((index+1) == this.manifest.segment_parts){
							this.ms.endOfStream();
						}   
						this.updating = false;
						delete this.dl[index];
					};
					return;
				}
				
				if(item.xhr.status == 404){
					throw("ERROR: media files not found");
				}
            }
        });
        item.xhr.open('GET', this.manifest.file);
        item.xhr.setRequestHeader('Range', 'bytes=' + this.manifest.segments[index]);
        item.xhr.responseType = 'arraybuffer';
        item.xhr.send();
    }

    update(time){
        if(this.updating){return;}
        let i = this.find_buffer(time); if(i === false){console.log("error, inte bra.."); return;}
        if(time > (this.video.buffered.end(i) - (this.manifest.segment_duration*0.4))){
            this.updating = true;
            this.download(Math.ceil(time/this.manifest.segment_duration));
            console.log("buffer index: " + i);
        }
    }

    find_buffer(time){
        for(let i = 0; i < this.buffer.buffered.length; i++){
			if(time >= this.buffer.buffered.start(i) && time <= this.buffer.buffered.end(i)){
                return i;
            }
        }
        this.loading(true);
        return false;
    }

    seek(time){
        if(time >= 0 && time <= this.video.duration){
            this.video.currentTime = time; console.log("SEEK TO: "+time);
            if(this.find_buffer(time) !== false){return;}

            this.updating = true;
            this.kill();

            let index = Math.floor(time/this.manifest.segment_duration);
            this.download(index);
                    
            //fix small number offset, ex: 5.9945 insted of 6.0
			if(((index+1)*this.manifest.segment_duration-time) < 0.5){
                //timeout 100ms to prevent buffer error(?)
                setTimeout(() => {this.download(index+1);}, 100);
            }
        }
    }

    kill(){
        //vad händer när xhr status = completed, buffert error?
        for(let i in this.dl){
            this.dl[i].xhr.abort();
        }
    }

    playback_end(){
        console.log("end of content");
    }

    playback(){
        this.play_status = setInterval(() => {
            if(this.lasttime == this.video.currentTime){
                this.loading(true);
            }else {
                this.loading(false);
            }
            this.lasttime = this.video.currentTime;
            if(this.subtitles != null){this.controls.set_subtitles(this.video.currentTime);}
        }, 100);    
    }

    playback_stop(){
        clearInterval(this.play_status);
        this.loading(false);
    }

    loading(status){
        this.controls.loading(status);
    }

    average_dl_time(time){
        let count;
        let i = this.average_count % this.average_data.length;
        this.average_data[i] = time;
        
        this.average_count++;

        if(this.average_count < this.average_data.length){
            count = this.average_count;
        }else {
            count = this.average_data.length;
        }

        this.average_dl = Math.round((this.average_data.reduce((tot, num) => {return tot + num;}, 0))/count);
        this.controls.__test_set_average_dl(this.average_dl);
    }

    load_subtitles(url, id){
        if(url == null){
            this.subtitles = null;
            this.controls.hide_subtitles();
            return;
        }

        if(this.subtitles != null){
            if(this.subtitles.get_id() == id){
                return;
            }
        }
        
        this.subtitles = new Subtitles(url, id);
    }

}
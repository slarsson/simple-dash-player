'use strict';

class Controls {

    //player: reference to player object
    //preview: object containing (url:string, w:int, h:int, rows:int, cols:int), or NULL
    constructor(player, preview){
        this.player = player;
        this.preview_data = preview;

        //controls
        this.controls = document.createElement('div'); this.controls.id = "controls"; 

        //buttons-containers
        this.buttons = document.createElement('div'); this.buttons.id = 'buttons';
        let left = document.createElement('div'); left.id = 'items-left';
        let right = document.createElement('div'); right.id = 'items-right';

        //play/pause
        this.pp = document.createElement('div'); this.pp.id = 'pp'; this.pp.classList.add('btn');
        this.pp.innerText = "pp";
        this.pp.addEventListener('click', () => this.play());
        
        //time
        this.time = document.createElement('div'); this.time.id = 'time';
        this.now = document.createElement('span'); this.now.innerText = "00.00";
        this.end = document.createElement('span');
        this.time.appendChild(this.now);
        this.time.appendChild(this.end);

        //fullscreen
        this.fullscreen = document.createElement('div'); this.fullscreen.id = 'fullscreen'; this.fullscreen.classList.add('btn');
        this.fullscreen.innerText = "fs";

        //sound
        this.sound = document.createElement('div'); this.sound.classList.add('btn');
        this.sound.innerText = "vl";
        this.sound.addEventListener('click', () => this.display_volume());

        //settings
        this.settings = document.createElement('div');
        this.settings.innerHTML = "se";
        this.settings.classList.add('btn');
        this.settings.addEventListener('click', () => this.display_settings());

        //timebar
        this.timebar = document.createElement('div'); this.timebar.id = 'timebar';
        this.progress = document.createElement('div'); this.progress.id = 'progress';
        this.scan = document.createElement('div'); this.scan.id = 'scan';

        this.timebar.appendChild(this.progress);
        this.timebar.appendChild(this.scan);

        this.timebar.addEventListener('click', (e) => this.seek(e.offsetX));
        this.timebar.addEventListener('mousemove', (e) => this.hover(e.offsetX));
        this.timebar.addEventListener('mouseleave', () => this.clear_hover());

        //preview
        this.preview = document.createElement('div'); this.preview.id = 'preview';
        this.preview.style.marginLeft = "-9999px";
        this.preview_text = document.createElement('span');
 
        if(this.preview_data == null){
            this.preview.appendChild(this.preview_text);
            this.preview.classList.add('preview_no_image');
        }else {
            this.preview_image_container = document.createElement('div'); this.preview_image_container.id = 'preview_image_container';
            this.preview_image = document.createElement('div'); this.preview_image.id = 'preview_image';
            this.set_preview(this.preview_data);
            this.preview_image.appendChild(this.preview_text);
            this.preview_image_container.appendChild(this.preview_image);
            this.preview.appendChild(this.preview_image_container);
        }

        //add to contols
        left.appendChild(this.pp);
        left.appendChild(this.time);
        right.appendChild(this.settings);
        right.appendChild(this.sound);
        right.appendChild(this.fullscreen);
        
        this.buttons.appendChild(left);
        this.buttons.appendChild(right);
 
        this.controls.appendChild(this.preview);
        this.controls.appendChild(this.timebar);
        this.controls.appendChild(this.buttons);

        //loading
        this.loading_status = null;
        this.loading_div = document.createElement('div'); this.loading_div.id = 'loading';
        let spinner = document.createElement('div'); spinner.id = 'spinner';
        this.loading_div.appendChild(spinner);

        //subtitles
        this.subtitles = document.createElement('div'); this.subtitles.id = 'subtitles';
        this.subtitles_text = document.createElement('div');
        this.subtitles.appendChild(this.subtitles_text);

        //input/info
        this.input = document.createElement('div'); this.input.id = 'input';
        this.input.addEventListener('click', () => this.play());
        this.input.addEventListener('click', () => this.hide_box());

        //box/container
        this.box_div = document.createElement('div'); this.box_div.id = 'box_container';
        this.box = document.createElement('div'); this.box.id = 'box';
        this.arrow = document.createElement('div'); this.arrow.id = 'arrow';
        
        this.box_div.appendChild(this.arrow);
        this.box_div.appendChild(this.box);

        //subtitles/settings
        this.subtitles_container = this.create_subtitle_list();
        this.subtitles_container.id = "settings-container";
        this.set_selected_subtitle();
        this.box.appendChild(this.subtitles_container);

        //volume
        this.volume_container = document.createElement('div'); this.volume_container.id = 'volume-container';
        this.volume = document.createElement('div'); this.volume.id = 'volume';
        this.volume_bar = document.createElement('div'); this.volume_bar.id = 'volume-bar';
        this.volume_pro = document.createElement('div'); this.volume_pro.id = 'volume-procentage';
        this.volume_pro.innerText = "100%";
        
        let v = document.createElement('div'); v.id = 'volume-bar-container';
        v.appendChild(this.volume_bar);
        v.appendChild(this.volume_pro);
        
        this.volume_container.appendChild(v);
        this.volume_bar.appendChild(this.volume);
        this.volume_bar.addEventListener('click', (e) => this.set_volume(e.offsetX));
        this.box.appendChild(this.volume_container);

        //TEST-DATA
        let test_div = document.createElement('div'); test_div.id = 'test_div';
        this.test_dl_time = document.createElement('span');
        this.test_dl_average = document.createElement('span');
        test_div.appendChild(this.test_dl_time);
        test_div.appendChild(this.test_dl_average);
        this.player.div.appendChild(test_div);

        //add to player
        this.player.div.appendChild(this.controls);
        this.player.div.appendChild(this.input);
        this.player.div.appendChild(this.box_div);
        this.player.div.appendChild(this.loading_div);
        this.player.div.appendChild(this.subtitles);

        //events
        this.player.video.addEventListener('timeupdate', () => this.update());  
        this.player.div.addEventListener('mousemove', () => this.display_controls());
        document.addEventListener('keypress', (e) => {
            if(e.code == "Space"){this.play();}
        }); 
    }

    play(){
		console.log("PLAY: " + this.player.video.duration);
        if(this.player.video.paused){
            this.player.video.play();
        }else {
            this.player.video.pause();
        }
        //this.display_controls();
    }

    //set 'div' to go fullscreen
    set_fullscreen(div){
        this.fullscreen.addEventListener('click', () => this.get_fullscreen(div));
        this.input.addEventListener('dblclick', () => this.get_fullscreen(div));
    }

    //request fullscreen for 'div'
    get_fullscreen(div){
        if(document.fullscreenElement || 
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement){
            
            if(document.exitFullscreen){
                document.exitFullscreen();
            }else if(document.mozCancelFullScreen){
                document.mozCancelFullScreen();
            }else if(document.webkitExitFullscreen){
                document.webkitExitFullscreen();
            }else if(document.msExitFullscreen){
                document.msExitFullscreen();
            }

        }else {

            if(div.requestFullscreen){
                div.requestFullscreen();
            }else if(div.mozRequestFullScreen){
                div.mozRequestFullScreen();
            }else if(div.webkitRequestFullscreen){
                div.webkitRequestFullscreen();
            }else if(div.msRequestFullscreen){
                div.msRequestFullscreen();
            }  
        }
    }
    
    //set duration from loaded metadata
    set_duration(){
        if(this.player.video.duration >= 3600){this.hours = true;}
        this.end.innerHTML = " / " + this.format_time(this.player.video.duration);
    }

    update(){
        this.now.innerHTML = this.format_time(this.player.video.currentTime);
        this.update_timebar(this.player.video.currentTime);
    }
    
    //sec to hh:mm:ss
    format_time(t){ 
        let h = Math.trunc(t/3600);
        let m = Math.trunc((t-(h*3600))/60); 
        let s = Math.trunc(t-(h*3600 + m*60)); 

        if(s < 10){s = "0"+s;}
        if(m < 10){m = "0"+m;}
        if(h < 10){h = "0"+h;}

        if(this.hours == null){h = "";}else{h = h + ":";}

        return h + m + ":" + s; 
    }

    //update timebar position
    //t: secounds ??
    update_timebar(t){
        this.progress.style.width = 100*((t*(this.timebar.clientWidth/this.player.video.duration))/this.timebar.clientWidth) + "%";      
    }

    //seek from timebar position
    seek(pos){
        if(pos <= 1.5){pos = 0;}
        let goto = pos*(this.player.video.duration/this.timebar.clientWidth);
        this.player.seek(goto);
        this.update_timebar(goto);
        if(this.player.subtitles != null){this.set_subtitles(goto)};     
    }
    
    hover(pos){
        if(pos <= 1.5){pos = 0;}
        this.scan.style.width = 100*(pos/this.timebar.clientWidth) + "%";
        this.preview_text.innerHTML = this.format_time(pos*(this.player.video.duration/this.timebar.clientWidth));

        if(this.preview_data != null){
            let i = Math.trunc(pos/(this.timebar.clientWidth/this.preview_data.n));
            this.preview_image.style.backgroundPositionX = (-1)*(this.preview_data.w*(i%this.preview_data.cols))+"px";
            this.preview_image.style.backgroundPositionY = (-1)*this.preview_data.h*Math.trunc(i/(this.preview_data.n/this.preview_data.rows))+"px";
        }

        let window_offset = pos - (this.preview.clientWidth/2);
        if(window_offset < 0){window_offset = 0;}
        if((pos+(this.preview.clientWidth/2)) > this.timebar.clientWidth){window_offset = (this.timebar.clientWidth-this.preview.clientWidth)}
       
        this.preview.style.marginLeft = window_offset+"px";
   }

    clear_hover(){
        this.scan.style.width = "0px";
        this.preview.style.marginLeft = "-9999px";
    }

    set_preview(obj){
        this.preview_data = obj;
        this.preview_data.n = obj.cols*obj.rows;
        this.preview_image.style.backgroundImage = "url('"+obj.url+"')";
        this.preview_image_container.style.width = obj.w+"px";
        this.preview_image_container.style.height = obj.h+"px";
    }

    display_controls(){
        this.controls.style.marginLeft = "0px";
        let offset = (this.buttons.clientHeight + this.timebar.clientHeight) + "px";
        this.subtitles.style.marginBottom = offset;
        this.input.style.marginBottom = offset;
        //if(this.player.video.paused){return;}
        clearTimeout(this.show);
        this.show = setTimeout(() => {
            this.controls.style.marginLeft = "-9999px";
            this.subtitles.style.marginBottom = "0px";
            this.input.style.marginBottom = "0px";
            this.box_div.style.visibility = 'hidden';
        }, 3000);
    }

    loading(status){
        if(this.loading_status == status){return;}

        if(status){
            this.loading_div.style.marginLeft = "0px";
        }else {
            this.loading_div.style.marginLeft = "-9999px";
        }

        this.loading_status = status;
    }

    error(msg){
        this.controls.innerHTML = "";
        this.loading_div.innerHTML = msg;
    }

    set_subtitles(time){
        let text = this.player.subtitles.get(time);
        if(text == null){
            this.subtitles.style.marginLeft = "-9999px";
        }else {
            if(this.subtitles_text.innerHTML == text){return;}
            this.subtitles_text.innerHTML = text;
            this.subtitles.style.marginLeft = "0px"; 
        }
    }

    hide_subtitles(){
        this.subtitles.style.marginLeft = "-9999px";
    }

    show_box(){
        if(this.box_div.style.visibility == "visible"){
            this.box_div.style.visibility = "hidden";
            return false;
        }
        this.box_div.style.visibility = "visible";
        return true;
    }

    hide_box(){
        this.box_div.style.visibility = "hidden";
    }

    display_settings(){
        if(!this.show_box()){return};
        this.subtitles_container.style.display = "block";
        this.volume_container.style.display = "none";
        this.set_box_pos(this.settings);
    }

    display_volume(){
        if(!this.show_box()){return};
        this.subtitles_container.style.display = "none";
        this.volume_container.style.display = "block";
        this.set_box_pos(this.sound);
    }

    set_box_pos(div){
        this.arrow.style.marginBottom = this.buttons.clientHeight - 5 + "px";
        let offset = (this.player.div.clientWidth - div.offsetLeft - (this.box.clientWidth/2) - (div.clientWidth/2));
        if(offset <= 10){offset = 10;}
        this.box.style.marginRight = offset + "px";
        this.arrow.style.marginRight = (this.player.div.clientWidth - div.offsetLeft - (this.arrow.offsetWidth/2) - (div.clientWidth/2)) + "px";
    }

    create_subtitle_list(){
        let list = document.createElement('div');
        
        let none = document.createElement('div');
        none.dataset.id = "null"; none.classList.add('box-btn');
        none.innerText = "null";
        list.appendChild(none);
        none.addEventListener('click', () => {
            this.hide_subtitles();
            this.player.load_subtitles(null);
            this.set_selected_subtitle();
        });
        
        for(let i = 0; i < this.player.available_subtitles.name.length; i++){
            let div = document.createElement('div');
            div.dataset.id = i; div.classList.add('box-btn');
            div.innerText = this.player.available_subtitles.name[i];
            list.appendChild(div);
            div.addEventListener('click', () => {
                this.hide_subtitles();
                this.player.load_subtitles(this.player.available_subtitles.url[i], i)
                this.set_selected_subtitle();
            });
        }

        return list;
    }

    set_selected_subtitle(){
        if(this.player.subtitles == null){
            for(let data of this.subtitles_container.children){
                if(data.dataset.id == "null"){
                    data.classList.add('selected');
                }else {
                    data.classList.remove('selected');
                }
            }
            return;
        }

        for(let data of this.subtitles_container.children){
            if(data.dataset.id == this.player.subtitles.get_id()){
                data.classList.add('selected');
            }else {
                data.classList.remove('selected');
            }
        }
    }

    set_volume(pos){
        let x = Math.ceil(100*(pos/this.volume_bar.clientWidth));
        if(x > 98){x = 100;}
        this.volume.style.width = x + "%";
        this.volume_pro.innerText = x + "%";
        console.log(x);
    }

    //test functions:
    __test_set_dl_time(time){
        this.test_dl_time.innerHTML = "now: " + time + "ms";
        console.log("XHR REQUEST COMPLETED IN " + time + "ms");
    }

    __test_set_average_dl(time){
        this.test_dl_average.innerHTML = ", average: " + time + "ms";
        console.log("AVERAGE DL TIME " + time + "ms");
    }
    
}
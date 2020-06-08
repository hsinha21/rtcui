import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as io from 'socket.io-client';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  @ViewChild("videoElement") videoElement: ElementRef;
  @ViewChild("remoteVideo") remoteVideo: ElementRef;

  socket: any;

  configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

  peerConnection: any;

  constructor() {
    this.socket = io('http://localhost:3000')
  }

  ngOnInit(): void {

  }

  async openingAdminRTC() {

  this.peerConnection = await new RTCPeerConnection(this.configuration);

    navigator.getUserMedia({ video: true, audio: true }, async stream => {

      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();

      stream.getTracks().forEach(track => { this.peerConnection.addTrack(track, stream) });

    },
      error => {
        console.warn(error.message);
      }
    );

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      console.log(stream);

      this.remoteVideo.nativeElement.srcObject = stream
    };
    

    this.socket.on("call-made", async data => {
      console.log(data);

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(new RTCSessionDescription(answer));

      console.log(this.peerConnection);

      this.socket.emit("make-answer", { 
        answer,
        to: data.from  
      });
    });

  }

}

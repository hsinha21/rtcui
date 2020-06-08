import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as io from 'socket.io-client';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  @ViewChild("videoElement") videoElement: ElementRef;
  @ViewChild("remoteVideo") remoteVideo: ElementRef;

  isAlreadyCalling: Boolean = false;

  configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}

  socket: any;

  peerConnection: any;

  constructor() {
    this.socket = io('http://localhost:3000')

  }

  ngOnInit(): void {

    this.setUpRTCForUser();

  }

  async setUpRTCForUser() {

    this.peerConnection = await new RTCPeerConnection(this.configuration);

    navigator.getUserMedia({ video: true, audio: true }, async stream => {

      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();

      console.log(stream.getTracks());

      stream.getTracks().forEach(track => { this.peerConnection.addTrack(track, stream) });

    },
      error => {
        console.warn(error.message);
      }
    );

    this.socket.on("answer-made", async data => {
      console.log("answer-made : ", data);

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));

      console.log(this.peerConnection);


      // this.callAdmin();
      console.log(this.isAlreadyCalling);


      if (!this.isAlreadyCalling) {
        this.callAdmin();
        this.isAlreadyCalling = true;
      }

    });

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      console.log(stream);

      this.remoteVideo.nativeElement.srcObject = stream
    };
  }

  async callAdmin() {

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(new RTCSessionDescription(offer));

    console.log(this.peerConnection);

    this.socket.emit("call-user", { 
      offer,
      from: this.socket.id
    });

    
  }

}

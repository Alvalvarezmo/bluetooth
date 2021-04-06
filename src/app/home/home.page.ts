import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { AlertController, ToastController } from '@ionic/angular';


//Constants
const headerB_1 = 0xAA; //header byte 1
const headerB_2 = 0x55; //header byte 2
const cmdGetID = 0x02;  //Command code - request ID
const cmdSetPassword = 0xB1; //Command code - set password: must go followed with the pass (2 integer bytes)

//Device - blood pressure monitor
let iBloodPressure = {
  name: '',
  model: '',
  serialNumber: '',
  sytolic_value: '',
  diastolic_value: '',
  pulse: ''
}

//Data read from the buffer
let dataRead = new Uint8Array();
let prueba = "Hola";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})


export class HomePage {

  constructor( private bluetoothSerial: BluetoothSerial, private alertCtrl:AlertController, private toastCtrl: ToastController ) {
    prueba = "Adios";
    this.checkBluetoothEnable();

  }


//For now we enable bluetooth out of the app, check that this procedure was done
  checkBluetoothEnable(){
    this.bluetoothSerial.isEnabled().then(success => {
      console.log(success);
      this.showToast('Bluetooth enabled');
      this.checkBluetoothConnected();
    }, error => {
      console.log(error);
      this.showError('Please enable and connect bluetooth')
    });
  }


//For now we conect with the device out of the app, check that this procedure was done  
  checkBluetoothConnected(){
    this.bluetoothSerial.isConnected(). then(success => {
      console.log(success);
      this.showToast('Connected with device');
      this.bluetoothSerial.subscribeRawData().subscribe((data) => {
        console.log("Data:", data);
        dataRead = data;
      });      
    }, error => {
      console.log(error);
      this.showError('Please connect with the device')
    });
  }


//Check data received
  checkData(lenght, auxData: any) {
    //variables
    let auxCheckSum = 0x00;
    
    //transform data
    dataRead = new Uint8Array(auxData);

    //check headers and checksum
    if (dataRead[0]===headerB_1 && dataRead[1]===headerB_2) {
      for(let i = 2; i<lenght; i++){
        auxCheckSum = auxCheckSum + dataRead[i];
      };
    } else {
      auxCheckSum = 0x00;
    };
    if (auxCheckSum === dataRead[lenght - 1]){
      console.log('Correct data format');
      this.getValFromData(dataRead);
    } else {
      console.log('Non correct data format - headers or checksum mismatch');
      console.log(dataRead);
      this.showError('Received data has not correct format')
    };
  }


//Get the values received in the data
  getValFromData(auxData: any){
    switch(auxData[3]) {
      case 0xA0: 
        console.log('Device id');
        iBloodPressure.model = `${auxData[4]}`;
        iBloodPressure.serialNumber = `${auxData[6]}${auxData[7]}${auxData[8]}${auxData[9]}${auxData[10]}`;
        break;
      case 0x34:
        console.log('Blood pressure data');
        iBloodPressure.sytolic_value = `${auxData[4] + auxData[5]}`;
        iBloodPressure.diastolic_value = `${auxData[6] + auxData[7]}`;
        iBloodPressure.pulse = `${auxData[8] + auxData[9]}`;
        break;
      default:
        console.log('Not recognised data value');
        this.showError('Corrupted or not recognised data value');
    }
  }

//Show errors in alert style
  async showError(error){
    let alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Error',
      message: error,
      buttons: ['Close']
    });
    await alert.present();
  }


//Show toast, information for some time
  showToast(message){
    let toast = this.toastCtrl.create({
      message: message,
      duration: 1000  //1 second
    });
  }


  getID_cmd() {
    const instructionLenght = 0x02;
    var checkSum = cmdGetID + instructionLenght;
    var dataWrite = [headerB_1, headerB_2, instructionLenght, cmdGetID, checkSum];
    
    this.bluetoothSerial.write(new Uint8Array(dataWrite))
      .then(success => {
              console.log(dataWrite);
              console.log(success);
      },    failure => {
              console.log(failure);
    });
  }
  

}


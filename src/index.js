import express from 'express';
import dotenv from 'dotenv';
import Controllerdb from './Controllerdb';
import Authdonor from './Auth/Authdonor';
import Authhospital from './Auth/Authhospital';
import Authbanks from './Auth/Authbanks';
import Authadmin from './Auth/Authadmin';
dotenv.config();
const app = express()
app.use(express.json())
app.get('/', (req, res) => {
    return res.status(200).send({'message': 'YAY! Congratulations! Your first endpoint is working'});
  });
app.post('/donor/signup', Controllerdb.create);
app.post('/donor/login',Controllerdb.login);
app.get('/donor',Authdonor.verifyToken,Controllerdb.profile);
app.get('/donor/banks',Authdonor.verifyToken,Controllerdb.dgetbanks);
app.get('/donor/history',Authdonor.verifyToken,Controllerdb.history);
app.put('/donor',Authdonor.verifyToken, Controllerdb.edit);
app.post('/donor',Authdonor.verifyToken,Controllerdb.donate);
app.post('/bank/login',Controllerdb.blogin);
app.get('/bank',Authbanks.verifyToken,Controllerdb.bprofile);
app.get('/bank/donors', Authbanks.verifyToken, Controllerdb.getdonors);  
app.delete('/bank/donors/:donorid', Authbanks.verifyToken, Controllerdb.deletedonors);
app.get('/bank/donate', Authbanks.verifyToken,Controllerdb.listdonate);
app.put('/bank/donate/:donate_id', Authbanks.verifyToken,Controllerdb.handledonate)  
app.get('/bank/store',Authbanks.verifyToken,Controllerdb.getstores);
app.put('/bank/store/:donate_id',Authbanks.verifyToken,Controllerdb.stores);
app.get('/bank/bloodstore',Authbanks.verifyToken,Controllerdb.bloodstores);
app.get('/bank/order',Authbanks.verifyToken,Controllerdb.bgetorder);
app.get('/bank/handleorder',Authbanks.verifyToken,Controllerdb.gethandleorder);
app.put('/bank/handleorder/:orderid',Authbanks.verifyToken,Controllerdb.handleorder);
app.post('/hospital/login',Controllerdb.hlogin);
app.get('/hospital',Authhospital.verifyToken,Controllerdb.hprofile);
app.get('/hospital/order',Authhospital.verifyToken,Controllerdb.hgetorder);
app.post('/hospital/order',Authhospital.verifyToken,Controllerdb.order);
app.put('/hospital/order/:orderid',Authhospital.verifyToken,Controllerdb.editorder);
app.delete('/hospital/order/:orderid',Authhospital.verifyToken,Controllerdb.deleteorder);
app.post('/admin/login',Controllerdb.alogin);
app.post('/admin/addbank',Authadmin.verifyToken,Controllerdb.addbank);
app.get('/admin/banks',Authadmin.verifyToken,Controllerdb.getbanks);
app.delete('/admin/banks/:bankid',Authadmin.verifyToken,Controllerdb.deletebanks);  
app.post('/admin/addhospital',Authadmin.verifyToken,Controllerdb.addhospital);
app.get('/admin/hospitals',Authadmin.verifyToken,Controllerdb.gethospitals);
app.delete('/admin/hospitals/:hospitalid',Authadmin.verifyToken,Controllerdb.deletehospitals);  
app.listen(process.env.PORT, () => {
    console.log(`App running on port ${process.env.PORT}.`)
  })
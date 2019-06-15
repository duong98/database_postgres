import uuidv4 from "uuid/v4";
import db from "./db";
import Helper from "./Helper";

const Controllerdb = {
  /**
   * Create A donor
   * @param {object} req
   * @param {object} res
   * @returns {object} reflection object
   */
  async create(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res
        .status(400)
        .send({ 'message': 'Please enter a valid email address' });
    }
    const hashPassword = Helper.hashPassword(req.body.password);
    const createQuery = 'Insert into donors(id,first_name,last_name, email, password, DateOfBirth,blood_type, gender, address, contact_no) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *';
    const values = [
      uuidv4(),
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      hashPassword,
      req.body.DateOfBirth,
      req.body.blood_type,
      req.body.gender,
      req.body.address,
      req.body.contact_no
    ];

    try {
      const { rows } = await db.query(createQuery, values);
      if (rows[0])
        return res.status(200).send({ 'Message':'signup successful' });
    } catch (error) {
      if (error.routine === "_bt_check_unique") {
        return res
          .status(400)
          .send({ 'message': 'Donor with that EMAIL already exist' });
      }
      return res.status(400).send(error);
    }
  },
  /**
   * Login
   * @param {object} req
   * @param {object} res
   * @returns {object} Donor object
   */
  async login(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res
        .status(400)
        .send({ 'message': 'Please enter a valid email address' });
    }
    const text = 'SELECT * FROM donors WHERE email = $1';
    try {
      const { rows } = await db.query(text, [req.body.email]);
      if (!rows[0]) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      if (!Helper.comparePassword(rows[0].password, req.body.password)) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      const token = Helper.generateToken(rows[0].id);
      return res.status(200).send({ token });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  /**
   * Delete A donor
   * @param {object} req
   * @param {object} res
   * @returns {void} return status code 204
   */
  /*async delete(req, res) {
    const deleteQuery = "DELETE FROM donor WHERE id=$1 returning *";
    try {
      const { rows } = await db.query(deleteQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'donor not found' });
      }
      return res.status(204).send({ 'message': 'deleted' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },*/
  async profile(req, res) {
    const profileQuery = 'Select * FROM donors WHERE id=$1';
    try {
      const { rows } = await db.query(profileQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'donor not found'});
      }
      else {
        return res.status(200).json(rows[0]);
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async edit(req, res) {
    if (!req.body.email) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res
        .status(400)
        .send({ 'message': 'Please enter a valid email address' });
    }
    const editQuery =
      "Update donors set first_name=$1,last_name=$2, email=$3, DateOfBirth=$4,blood_type=$5, gender=$6, address=$7, contact_no=$8 where id=$9 returning *";
    const values0 = [
      req.body.first_name,
      req.body.last_name,
      req.body.email,
      req.body.DateOfBirth,
      req.body.blood_type,
      req.body.gender,
      req.body.address,
      req.body.contact_no,
      req.user.id
    ];
    try {
      const { rows } = await db.query(editQuery, values0);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'donor not found' });
      }
      return res.status(200).send({ 'message': 'updated' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async donate(req, res) {
    if (!req.body.DateOfDonate || !req.body.bank_name) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    const donateQuery =
      "Insert into blood(id,donor_id,bank_id,DateOfDonate) values ($1,$2,$3,$4) returning *";
    /* const checkdateQuery =
      "Select DateOfDonate,count(*) as k from blood where DateOfDonate=$1 group by DateOfDonate";*/
    const checkstatusQuery = "Select * from register where donor_id=$1 and bank_id=$2";
    const checkbankQuery = "Select * from BloodBank where name=$1"
    const registerQuery =
      "Insert into register(id,donor_id,bank_id,status) values($1,$2,$3,$4) returning *";
    try {
      const rows0 = await db.query(checkbankQuery, [req.body.bank_name]);
      if (!rows0.rows[0]) {
          return res.status(404).send({ 'message': 'bank name not found' });
      }
      const {rows} = await db.query(checkstatusQuery,[req.user.id,rows0.rows[0].id]);
      if (rows[0]){ 
        if (rows[0].status == "B")
            return res.status(400).send({ 'message': 'donors banned' });
      }
      else {
        const values1 = [uuidv4(), req.user.id, rows0.rows[0].id ,'A'];
        await db.query(registerQuery, values1)
      }
            /*
            const rows0 = await db.query(checkdateQuery,[req.body.DateOfDonate]).rows;
            if (rows0[0]) {
              if (rows0[0].k > 1000)
                return res.status(400).send({ 'message': 'date not availabe,too many people' });
                */
      const values2 = [uuidv4(), req.user.id, rows0.rows[0].id, req.body.DateOfDonate];
      const rows1 = await db.query(donateQuery, values2);
      if (!rows1.rows[0]) 
        return res.status(404).send({ 'message': 'donor not found' });
      return res.status(200).send({ 'message': 'donate time setted' });
    } catch (error) {
        return res.status(400).send(error);
    }
  },
  async dgetbanks(req, res) {
    const getbanksQuery = "Select name, address, email from BloodBank";
    try {
      const { rows } = await db.query(getbanksQuery);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'banks record cannot be getted' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async history(req, res) {
    const getbanksQuery = "Select DateOfDonate,Amount,name from blood inner join BloodBank on blood.bank_id=BloodBank.id where donor_id=$1 and amount is not null order by DateOfDonate";
    try {
      const { rows } = await db.query(getbanksQuery,[req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no record' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async alogin(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    const text = "SELECT * FROM admin WHERE email = $1";
    try {
      const { rows } = await db.query(text, [req.body.email]);
      if (!rows[0]) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      if (rows[0].password != req.body.password) {
        return res
          .status(400)
          .send({ 'message': 'The password you provided is incorrect' });
      }
      const token = Helper.generateToken(rows[0].id);
      return res.status(200).send({ token });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async addbank(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res
        .status(400)
        .send({ 'message': 'Please enter a valid email address' });
    }
    const hashPassword = Helper.hashPassword(req.body.password);
    const createQuery = 'Insert into BloodBank(id, name, email, address, password, admin_id) VALUES($1, $2, $3, $4, $5, $6) returning *';
    const values = [
      uuidv4(),
      req.body.name,
      req.body.email,
      req.body.address,
      hashPassword,
      req.user.id
    ];

    try {
      const { rows } = await db.query(createQuery, values);
      if (rows[0])
        return res.status(200).send({ 'Message':'add bank successful' });
    } catch (error) {
      if (error.routine === "_bt_check_unique") {
        return res
          .status(400)
          .send({ 'message': 'bank with that EMAIL already exist' });
      }
      return res.status(400).send(error);
    }
  },
  async getbanks(req, res) {
    const getbanksQuery = "Select * from BloodBank where admin_id=$1";
    try {
      const { rows } = await db.query(getbanksQuery,[req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'banks record cannot be getted' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async deletebanks(req, res) {
    const deletehospitalsQuery = "Delete from BloodBank where admin_id=$1 and id=$2";
    try {
      await db.query(deletehospitalsQuery,[req.user.id,req.params.bankid]);
      return res.status(200).send({ 'message': 'deleted bank record' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async addhospital(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res
        .status(400)
        .send({ 'message': 'Please enter a valid email address' });
    }
    const hashPassword = Helper.hashPassword(req.body.password);
    const createQuery = 'Insert into Hospital(id, name, email, address, password, admin_id) VALUES($1, $2, $3, $4, $5, $6) returning *';
    const values = [
      uuidv4(),
      req.body.name,
      req.body.email,
      req.body.address,
      hashPassword,
      req.user.id
    ];

    try {
      const { rows } = await db.query(createQuery, values);
      if (rows[0])
        return res.status(200).send({ 'Message':'add hospital successful' });
    } catch (error) {
      if (error.routine === "_bt_check_unique") {
        return res
          .status(400)
          .send({ 'message': 'hospital with that EMAIL already exist' });
      }
      return res.status(400).send(error);
    }
  },
  async gethospitals(req, res) {
    const gethospitalsQuery = "Select * from hospital where admin_id=$1";
    try {
      const { rows } = await db.query(gethospitalsQuery,[req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'hospitals record cannot be getted' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async deletehospitals(req, res) {
    const deletehospitalsQuery = "Delete from Hospital where admin_id=$1 and id=$2";
    try {
      await db.query(deletehospitalsQuery,[req.user.id,req.params.hospitalid]);
      return res.status(200).send({ 'message': 'deleted hospital record' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async blogin(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    const text = "SELECT * FROM BloodBank WHERE email = $1";
    try {
      const { rows } = await db.query(text, [req.body.email]);
      if (!rows[0]) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      if (!Helper.comparePassword(rows[0].password, req.body.password)) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      const token = Helper.generateToken(rows[0].id);
      return res.status(200).send({ token });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async bprofile(req, res) {
    const profileQuery = "Select * FROM bloodbank WHERE id=$1";
    try {
      const { rows } = await db.query(profileQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'bank not found' });
      }
      return res.status(200).json(rows[0]);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async getdonors(req, res) {
    const getdonorQuery = "Select donors.* from register inner join donors on register.donor_id=donors.id where bank_id=$1 and status='A'";
    try {
      const { rows } = await db.query(getdonorQuery,[req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no donors' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async deletedonors(req, res) {
    const getdonorQuery="Select * from register where bank_id=$1 and donor_id=$2"
    const deletedonorQuery = "Update register set status=$1 where id=$2";
    try {
      const { rows } = await db.query(getdonorQuery,[req.user.id,req.params.donorid]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'donors record cannot be getted' });
      }
      if (rows[0].status=='B'){
        return res.status(400).send({ 'message': 'donor record already banned' });
      }
      await db.query(deletedonorQuery,['B',rows[0].id]);
      return res.status(200).send({ 'message': 'deleted donor record' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async listdonate(req, res) {
    const getorderQuery =
      "Select * from blood where bank_id=$1 and status='P' order by DateOfDonate";
    try {
      const { rows } = await db.query(getorderQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'list donate request not found' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async handledonate(req, res) {
    if (!req.body.status) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    const handledonateQuery =
      "Update blood set status=$1 where bank_id=$2 and id=$3 returning *";
    const values8=[
      req.body.status,
      req.user.id,
      req.params.donate_id
    ]
    try {
      await db.query(handledonateQuery, values8);
      return res.status(200).send({ 'message': 'accepted donate' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async getstores(req, res) {
    const getQuery = "Select * from blood where bank_id=$1 and amount is null and status='A' order by DateOfDonate";
    try {
      const { rows } = await db.query(getQuery,[req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'blood record cannot be getted' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async stores(req, res) {
    const amountQuery = "Update blood set amount=$1,status=$2 where id=$3";
    const getstoreQuery = 
      "Select blood_type,amount from blood inner join donors on blood.donor_id=donors.id where blood.id=$1 and status='A'"
    const checkstorequery = 
      "Select * from bloodstore where BloodType=$1 and bank_id=$2";
    const insertstoreQuery =
      "Insert into Bloodstore(id,BloodType,Amount,bank_id) values($1,$2,$3,$4)";
    const updatestoreQuery =
      "Update Bloodstore set Amount=$1 where id=$2";
    const values4 = [req.body.amount,'R', req.params.donate_id];
    try {
      await db.query(amountQuery, values4);
      const {rows} = await db.query(getstoreQuery,[req.params.donate_id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'already accepted added amount to bloodstore' });
      }
      const rows0 = await db.query(checkstorequery,[rows[0].blood_type,req.user.id]);
        if(!rows0.rows[0]){
          await db.query(insertstoreQuery,[uuidv4(),rows[0].blood_type,rows[0].amount,req.user.id])
        } else {
          var total_amount = rows[0].amount+rows0.rows[0].amount;
          await db.query(updatestoreQuery,[total_amount,rows0.rows[0].id]);
        }
      return res.status(200).send({ 'message': 'updated record stored' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async bloodstores(req, res) {
    const getstoreQuery = 
      "Select * from Bloodstore where bank_id=$1";
    try {
      const { rows } = await db.query(getstoreQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no record' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async bgetorder(req, res) {
    const bgetorderQuery =
      "Select * from orders where bank_id=$1 and status='A'";
    try {
      const { rows } = await db.query(bgetorderQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no order' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async gethandleorder(req, res) {
    const gethandleorderQuery =
      "Select * from orders where bank_id=$1 and status='P'";
    try {
      const { rows } = await db.query(gethandleorderQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no order' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async handleorder(req, res) {
    const handleorderQuery =
      "Update orders set status=$1 where bank_id=$2 and id=$3 returning *";
    const getorderQuery =
      "Select * from orders where id=$1";
    const checkstorequery = 
      "Select * from bloodstore where BloodType=$1 and bank_id=$2";
    const updatestoreQuery =
      "Update bloodstore set Amount=$1 where id=$2";
    const values8=[
      req.body.status,
      req.user.id,
      req.params.orderid
    ]
    try {
      await db.query(handleorderQuery, values8);
      const { rows } = await db.query(getorderQuery, [req.params.orderid]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'cannot order' });
      } 
      if (rows[0].status == 'R') 
        return res.status(200).send({ 'message': 'rejected order' });
      if (rows[0].status == 'A') {
        const rows0 = await db.query(checkstorequery,[rows[0].bloodtype,req.user.id]);
        if(!rows0.rows[0]){
          return res.status(400).send({'Message': 'out of blood'})
        } else {
          var total_amount = rows0.rows[0].amount-rows[0].amount;
          await db.query(updatestoreQuery,[total_amount,rows0.rows[0].id]);
        }
        return res.status(200).send({ 'message': 'accepted order' });
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async hlogin(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({ 'message': 'Some values are missing' });
    }
    const text = "SELECT * FROM Hospital WHERE email = $1";
    try {
      const { rows } = await db.query(text, [req.body.email]);
      if (!rows[0]) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      if (!Helper.comparePassword(rows[0].password, req.body.password)) {
        return res
          .status(400)
          .send({ 'message': 'The credentials you provided is incorrect' });
      }
      const token = Helper.generateToken(rows[0].id);
      return res.status(200).send({ token });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async hprofile(req, res) {
    const profileQuery = "Select * FROM hospital WHERE id=$1";
    try {
      const { rows } = await db.query(profileQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'hospital not found' });
      }
      return res.status(200).json(rows[0]);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async order(req, res) {
    const checkbankQuery = "Select * from BloodBank where name=$1"
    const orderQuery =
      "Insert into orders(id,BloodType,Amount,hospital_id,bank_id,status) values($1,$2,$3,$4,$5,$6) returning *";
    try {
      const rows0 = await db.query(checkbankQuery, [req.body.bank_name]);
      if (!rows0.rows[0]) {
          return res.status(404).send({ 'message': 'bank name not found' });
      }
      const values6 = [
        uuidv4(),
        req.body.bloodtype,
        req.body.amount,
        req.user.id,
        rows0.rows[0].id,
        'P'
      ];
      const { rows } = await db.query(orderQuery, values6);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'order not found' });
      }
      return res.status(200).send({ 'message': 'created order' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async hgetorder(req, res) {
    const hgetorderQuery =
      "Select * from orders where hospital_id=$1";
    try {
      const { rows } = await db.query(hgetorderQuery, [req.user.id]);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'no order' });
      }
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async editorder(req, res) {
    const orderQuery =
      "Update orders set BloodType=$1,Amount=$2,hospital_id=$3 where id=$4 returning *";
    const values6 = [
      req.body.bloodtype,
      req.body.amount,
      req.user.id,
      req.params.orderid
    ]
    try {
      const { rows } = await db.query(orderQuery, values6);
      if (!rows[0]) {
        return res.status(404).send({ 'message': 'order not found' });
      }
      return res.status(200).send({ 'message': 'edited order' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
  async deleteorder(req, res) {
    const ckorder = "Select status from orders where id=$1 and hospital_id=$2"
    const deleteorderQuery =
      "Delete from orders where id=$1";
    const values7 = [
      req.params.orderid,
      req.user.id
    ]
    try {
      const rows9 = await db.query(ckorder, values7)
      if (!rows9.rows[0]) {
        return res.status(404).send({ 'message': 'order not found' });
      }
      if (rows9.rows[0] == 'A') return res.status(400).send({'message':'order already accepted'})
      await db.query(deleteorderQuery, [req.params.orderid]);
      return res.status(200).send({ 'message': 'deleted order' });
    } catch (error) {
      return res.status(400).send(error);
    }
  },
};

export default Controllerdb;

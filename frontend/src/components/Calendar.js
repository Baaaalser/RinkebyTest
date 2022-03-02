import { ViewState, EditingState, IntegratedEditing } from '@devexpress/dx-react-scheduler';
import { Scheduler, WeekView, Appointments, AppointmentForm } from '@devexpress/dx-react-scheduler-material-ui';

import { useState, useEffect } from 'react';
import { ethers } from "ethers";
import abi from "../abis/Calend3.json";

import { Box, Button, Slider } from '@material-ui/core';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';


const contractAddress = "0xEB61966ad351078218f919E35FE21ffB8BBaA5f8";
const contractABI = abi.abi;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(contractAddress, contractABI, provider.getSigner());  

// const schedulerData = [
//     { startDate: '2022-02-28T14:30', endDate: '2022-02-28T15:00', title: 'Meeting' },
//     { startDate: '2022-03-01T16:00', endDate: '2022-03-01T18:30', title: 'Go to a gym' },
//   ];




const Calendar = (props) => {

    // admin rate setting functionality
    const [showAdmin, setShowAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [rate, setRate] = useState(false);

    const [appointments, setAppointments] = useState([]);

    
    const [showDialog, setShowDialog] = useState(false);
    const [showSign, setShowSign] = useState(false);
    const [mined, setMined] = useState(false);
    const [transactionHash, setTransactionHash] = useState("");


    const getData = async () => {
      // get contract owner and set admin if connected account is owner
      const owner = await contract.owner();
      setIsAdmin(owner.toUpperCase() === props.account.toUpperCase());
      console.log(owner);

      const rate = await contract.getRate();
      setRate(ethers.utils.formatEther(rate.toString()));
      console.log(rate.toString());

      const appointmentData = await contract.getAppointments();
      console.log('got appointments');
      console.log(appointmentData);

      transformAppointmentData(appointmentData);

    } 

    const saveAppointment = async (data) => {
      const appointment = data.added;
      const title = appointment.title;
      const startTime = appointment.startDate.getTime() / 1000;
      const endTime = appointment.endDate.getTime() / 1000;

      setShowSign(true);
      setShowDialog(true);
      setMined(false);
    
      try {
          const cost = ((endTime - startTime) / 60) * rate;
          const msg = {value: ethers.utils.parseEther(cost.toString())};
          let transaction = await contract.createAppointment(title, startTime, endTime, msg);
          
          setShowSign(false);

          await transaction.wait();

          setMined(true);
          setTransactionHash(transaction.hash);
          
      } catch (error) {
          console.log(error);
      }
    }

    const transformAppointmentData = (appointmentData) => {
      let data = [];
      appointmentData.forEach(appointment => {
        data.push({
          title: appointment.title,
          startDate: new Date(appointment.startTime * 1000),
          endDate: new Date(appointment.endTime * 1000),
        });
      });
  
      setAppointments(data);
  }
  
    useEffect(() => {
      getData();
    }, []);


    const handleSliderChange = (event, newValue) => {
      setRate(newValue);
    };
    
    const saveRate = async () => {
      const tx = await contract.setRate(ethers.utils.parseEther(rate.toString()));
    }
    
    const marks = [
      {
          value: 0.0000,
          label: 'Free',
      },
      {
          value: 0.0002,
          label: '0.0002 ETH/min',
      },
      {
          value: 0.0004,
          label: '0.0004 ETH/min',
      },
      {
          value: 0.0006,
          label: '0.0006 ETH/min',
      },
      {
          value: 0.0008,
          label: '0.0008 ETH/min',
      },
      {
          value: 0.001,
          label: 'Expensive',
      },
      ];


    const Admin = () => {
      return <div id="admin">
          <Box>
              <h3>Set Your Minutely Rate</h3>
              <Slider id={"elslider"} defaultValue={parseFloat(rate)} 
                  step={0.0001} 
                  min={0} 
                  max={.001} 
                  marks={marks}
                  valueLabelDisplay="auto"
                  onChangeCommitted={handleSliderChange} />
              <br /><br />
              <Button id={"settings-button"} onClick={saveRate} variant="contained">
              <SettingsSuggestIcon /> save configuration</Button>
          </Box>
      </div>
    }

    const ConfirmDialog = () => {
      return <Dialog open={true}>
          <h3>
            {mined && 'Appointment Confirmed'}
            {!mined && !showSign && 'Confirming Your Appointment...'}
            {!mined && showSign && 'Please Sign to Confirm'}
          </h3>
          <div style={{textAlign: 'left', padding: '0px 20px 20px 20px'}}>
              {mined && <div>
                Your appointment has been confirmed and is on the blockchain.<br /><br />
                <a target="_blank" href={`https://rinkeby.etherscan.io/tx/${transactionHash}`}>View on Etherscan</a>
                </div>}
            {!mined && !showSign && <div><p>Please wait while we confirm your appoinment on the blockchain....</p></div>}
            {!mined && showSign && <div><p>Please sign the transaction to confirm your appointment.</p></div>}
          </div>
          <div style={{textAlign: 'center', paddingBottom: '30px'}}>
          {!mined && <CircularProgress />}
          </div>
          {mined && 
          <Button onClick={() => {
              setShowDialog(false);
              getData();
            }
            }>Close</Button>}
        </Dialog>
      }
      
    return (<div>
      <div>
      {isAdmin && <Button onClick={() => setShowAdmin(!showAdmin)} variant="contained" startIcon={<SettingsSuggestIcon />}>
          Admin
      </Button>}
      </div>
      {showAdmin && <Admin />}
      
      
  
      <div id="calendar">
          <Scheduler data={appointments}>
          <ViewState />
          <EditingState onCommitChanges={saveAppointment} />
          <IntegratedEditing />
          <WeekView startDayHour={9} endDayHour={23}/>
          <Appointments />
          <AppointmentForm />
        </Scheduler>
      </div>
      {showDialog && <ConfirmDialog />}
    </div>);

  

}




export default Calendar;
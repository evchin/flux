import React from 'react'
import create from './databaseContext'

const CosmosClient = require("@azure/cosmos").CosmosClient;
const config = require("./config");

const states = ["Alaska",
                "Alabama",
                "Arkansas",
                "American Samoa",
                "Arizona",
                "California",
                "Colorado",
                "Connecticut",
                "District of Columbia",
                "Delaware",
                "Florida",
                "Georgia",
                "Guam",
                "Hawaii",
                "Iowa",
                "Idaho",
                "Illinois",
                "Indiana",
                "Kansas",
                "Kentucky",
                "Louisiana",
                "Massachusetts",
                "Maryland",
                "Maine",
                "Michigan",
                "Minnesota",
                "Missouri",
                "Mississippi",
                "Montana",
                "North Carolina",
                "North Dakota",
                "Nebraska",
                "New Hampshire",
                "New Jersey",
                "New Mexico",
                "Nevada",
                "New York",
                "Ohio",
                "Oklahoma",
                "Oregon",
                "Pennsylvania",
                "Puerto Rico",
                "Rhode Island",
                "South Carolina",
                "South Dakota",
                "Tennessee",
                "Texas",
                "Utah",
                "Virginia",
                "Virgin Islands",
                "Vermont",
                "Washington",
                "Wisconsin",
                "West Virginia",
                "Wyoming"]

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      first: "",
      last: "",
      number: "",
      region: ""
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit(event) {
    if (this.state.first === "" || this.state.last === "" || this.state.number === "" || this.state.region === "") {
      alert("Please fill out all fields.")
      event.preventDefault();
    } else if(!states.includes(this.state.region)) {
      alert("Please enter a valid state.")
      event.preventDefault();
    } else {
      alert ("Hey there, " + this.state.first + ". Thanks for signing up. You've just taken a step towards creating a greener future.");
      event.preventDefault();
      createUser(this.state.first, this.state.last, this.state.number, this.state.region);
    }
  }

  render() {
    return (
        <form autoComplete="off" onSubmit={this.handleSubmit} className="form">
          <div className="header">
            <h1>Flux</h1>
            <p>Bringing balance to power.</p>
            <a className="about-link" href="/about.html">What is Flux?</a>
          </div>
          <div className='control block-cube block-input'>
            <input type="text" name="first" value={this.state.first} onChange={this.handleInputChange} placeholder="First Name"/>
            <div className='bg-top'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg-right'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg'>
              <div className='bg-inner'></div>
            </div>
          </div>
          <div className='control block-cube block-input'>
            <input type="text" name="last" value={this.state.last} onChange={this.handleInputChange} placeholder="Last Name"/>
            <div className='bg-top'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg-right'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg'>
              <div className='bg-inner'></div>
            </div>
          </div>
          <div className='control block-cube block-input'>
          <input type="number" name="number" value={this.state.number} onChange={this.handleInputChange} placeholder="Phone Number"/>
            <div className='bg-top'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg-right'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg'>
              <div className='bg-inner'></div>
            </div>
          </div>
          <div className='control block-cube block-input'>
            <input type="text" name="region" value={this.state.region} onChange={this.handleInputChange} placeholder="State"/>
            <div className='bg-top'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg-right'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg'>
              <div className='bg-inner'></div>
            </div>
          </div>
          <button className='btn block-cube block-cube-hover' type='submit'>
            <div className='bg-top'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg-right'>
              <div className='bg-inner'></div>
            </div>
            <div className='bg'>
              <div className='bg-inner'></div>
            </div>
            <div className='text'>
              Submit
            </div>
          </button>
          <div className='credits'>
            <a href='https://codepen.io/marko-zub/' target='_blank' rel="noreferrer">Form Designer</a><br></br>
            <a href="https://www.flaticon.com/authors/freepik" target='_blank' rel="noreferrer">Icon Credit</a><br></br>
            <a href="https://images.unsplash.com/photo-1484690088595-faea13012c39?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1502&q=80" target='_blank' rel="noreferrer">Hero Photographer</a>
          </div>
      </form>
    );
  }
}

async function createUser(first, last, number, region) {
  var { endpoint, key, databaseId, containerId } = config;
  const client = new CosmosClient({endpoint, key});
  const database = client.database(databaseId);
  const container = database.container(containerId);

  await create(client, databaseId, containerId);

  const newItem = {
      first: first,
      last: last,
      number: number,
      region: region
  };

  try {
      const {resource: createdItem} = await container.items.create(newItem);
      console.log(createdItem.first, createdItem.last, createdItem.number, createdItem.region)
  } catch (err) {
      console.log(err.message);
  }
}

export default User;
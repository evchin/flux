import React from 'react'

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      first: "",
      last: "",
      number: 0,
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
    alert ("Hey there, " + this.state.first + ". Thanks for signing up. You've just taken a step towards creating a greener future.");
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          First: 
          <input type="text" name="first" value={this.state.first} onChange={this.handleInputChange}/>
        </label> 
        <label>
          Last: 
          <input type="text" name="last" value={this.state.last} onChange={this.handleInputChange}/>
        </label> 
        <label>
          Number: 
          <input type="number" name="number" value={this.state.number} onChange={this.handleInputChange}/>
        </label> 
        <label>
          State: 
          <input type="text" name="region" value={this.state.region} onChange={this.handleInputChange}/>
        </label> 
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

// function App() {
//   <User />
// }

export default User;
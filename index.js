import './style';
import { Component } from 'preact';
import Pusher from 'pusher-js';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      computerPick: null,
      result: null,
      leaderboard: [],
    }

    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    const pusher = new Pusher('d46964dac1ca32ae084a', {
      cluster: 'eu',
      encrypted: true,
    });

    const channel = pusher.subscribe('leaderboard');
    channel.bind('update', data => {
      const { leaderboard } = this.state;
      const userIndex = leaderboard.findIndex(e => e.name === 'Player 1');
      leaderboard[userIndex].score += data.points;

      this.setState({
        computerPick: data.computerPick,
        result: data.points,
        leaderboard,
      });
    });

    fetch('http://localhost:7777/leaderboard')
      .then(response => response.json())
      .then(data => {
        this.setState({
          leaderboard: [...data.players],
        });
      })
      .catch(error => console.log(error));
  }

  handleClick(event) {
    const { value } = event.target;

    fetch(`http://localhost:7777/play?userPick=${value}`)
      .then(response => response.json())
      .catch(error => console.log(error));
  }

  render() {
    const { leaderboard, computerPick, result } = this.state;
    const sortedLeaderboard = leaderboard.sort((a, b) => b.score > a.score);
    const tableBody = sortedLeaderboard.map((player, index) => (
      <tr>
        <td>{index + 1}</td>
        <td>{player.name}</td>
        <td>{player.score}</td>
      </tr>
    ));

    const computerPicked = computerPick ?
      <span class="computer-message">The computer chose {computerPick}</span> : null;

    let message;
    if (result !== null) {
      message = result === 1 ?
        <span class="message-content">It's a draw</span> :
        result === 0 ? <span class="message-content fail">You Lost!</span> :
        <span class="message-content success">You won!</span>;
    } else {
      message = null;
    }

    return (
      <div class="App">
        <h1>Rock Paper Scissors</h1>

        <div class="button-row">
          <button onClick={this.handleClick} value="rock" class="rock">Rock</button>
          <button onClick={this.handleClick} value="paper" class="paper">Paper</button>
          <button onClick={this.handleClick} value="scissors" class="scissors">Scissors</button>
        </div>

        <div class="message">
          {message}
          {computerPicked}
        </div>

        <div class="leaderboard">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {tableBody}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

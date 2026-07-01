import socketio
import requests
import random
import time
import sys

# Configuration
BASE_URL = 'http://localhost:3001'
API_URL = f'{BASE_URL}/api'

def create_guest():
    print("Creating guest account...")
    res = requests.post(f'{API_URL}/auth/guest')
    if res.status_code == 200:
        data = res.json()
        return data['token'], data['user']
    else:
        print("Failed to create guest:", res.text)
        sys.exit(1)

def run_bot(room_to_join=None):
    token, user = create_guest()
    print(f"Logged in as {user['username']}")

    # Initialize Socket.io client
    sio = socketio.Client()
    
    player_number = None
    
    @sio.event
    def connect():
        print('Connected to server!')
        if room_to_join:
            print(f'Joining room {room_to_join}...')
            sio.emit('room:join', {'roomId': room_to_join})
        else:
            print('Creating new room...')
            sio.emit('room:create')

    @sio.on('room:created')
    def on_room_created(data):
        print(f"Room created! Room ID: {data['roomId']}")
        print(f"To play against this bot, run another instance with: python simulate_bot.py {data['roomId']}")
        
    @sio.on('game:start')
    def on_game_start(data):
        nonlocal player_number
        print('Game started!')
        for p in data['players']:
            if p['username'] == user['username']:
                player_number = p['playerNumber']
                break

        print(f"Assigned Player {player_number}")
        handle_turn(data['gameState'])

    @sio.on('game:state')
    def on_game_state(state):
        if state['phase'] == 'ended':
            print(f"Game Over! Winner: Player {state['winner']}")
            sio.disconnect()
            return
            
        handle_turn(state)
        
    @sio.on('game:error')
    def on_game_error(data):
        print("Game Error:", data['message'])

    def handle_turn(state):
        if state['currentPlayer'] != player_number:
            return # Not our turn
            
        print(f"Turn {len(state['moves'])} - Bot is thinking...")
        time.sleep(1) # Add a slight delay so it doesn't instantly play

        # 1. Find valid rack tiles
        rack = state['p1Rack'] if player_number == 1 else state['p2Rack']
        available_tiles = []
        if rack['numbers'] > 0:
            available_tiles.extend(['1', '2', '3', '4']) # Or read from available unique vals
        if rack['operators'] > 0:
            available_tiles.extend(['+', '-', '*', '/'])
            
        if not available_tiles:
            return

        # 2. Find empty spots on board
        empty_indices = [i for i, cell in enumerate(state['board']) if cell is None]
        if not empty_indices:
            return
            
        # 3. Pick random valid move (This is a naive bot that doesn't check specific Gobble rules like pink cells)
        # Note: A smarter bot would evaluate if placing an operator on a pink cell is valid.
        random_tile = random.choice(available_tiles)
        random_index = random.choice(empty_indices)
        
        print(f"Bot places {random_tile} at index {random_index}")
        sio.emit('tile:place', {
            'roomId': state['map']['roomId'] if 'roomId' in state['map'] else None, # Needs correct roomId extraction from your logic
            'playerNumber': player_number,
            'index': random_index,
            'tileValue': random_tile
        })

    # Connect to the server with JWT auth
    sio.connect(BASE_URL, auth={'token': token})
    sio.wait()

if __name__ == '__main__':
    target_room = sys.argv[1] if len(sys.argv) > 1 else None
    run_bot(target_room)

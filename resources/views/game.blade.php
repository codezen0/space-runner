<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>GAME</title>
</head>

<body>

    <div style="position: relative; width: 800px; height: 600px; margin: 0 auto;">
        <canvas id="gameCanvas" width="800" height="600"
            style="position: absolute; top: 0; left: 0; border: 1px solid #000; display: block; background-color: #000; background-image: radial-gradient(circle, #ff0 1px, transparent 1px), radial-gradient(circle, #ff0 1.5px, transparent 1.5px); background-size: 100px 100px, 200px 200px; background-position: 0 0, 40px 60px; color: #ff0;"></canvas>

        <div id="hud"
            style="position: absolute; top: 20px; left: 20px; color: #fff; font-family: 'Arial', sans-serif; font-size: 24px; font-weight: bold; z-index: 5; pointer-events: none; text-shadow: 0 0 5px #000;">
            Coins: <span id="coinsVal">{{ $totalCoins }}</span>
            <div id="shieldStatus" style="display: none; color: #0088ff; font-size: 18px; margin-top: 5px;">🛡️ Shield
                Active</div>
        </div>

        <!-- Timer HUD -->
        <div id="timerHud"
            style="position: absolute; top: 20px; right: 20px; color: #fff; font-family: 'Arial', sans-serif; font-size: 24px; font-weight: bold; z-index: 5; pointer-events: none; text-shadow: 0 0 5px #000;">
            Time: <span id="timeVal">00:00</span>
        </div>

        <!-- Start Menu Overlay -->
        <div id="startMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 10; border: 1px solid #000; box-sizing: border-box;">
            <h2 style="font-size: 48px; margin-bottom: 30px; letter-spacing: 5px; text-shadow: 0 0 10px #290c9a;">SPACE
                RUNNER</h2>
            <button id="startButton"
                style="padding: 15px 40px; font-size: 22px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px; transition: background-color 0.2s;">Start
                Game</button>
            <button id="playerMenuButton"
                style="padding: 15px 40px; font-size: 22px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px; transition: background-color 0.2s; margin-top: 10px;">Player</button>
            <button id="storeButton"
                style="padding: 15px 40px; font-size: 22px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px; transition: background-color 0.2s; margin-top: 10px;">Store</button>
        </div>


        <div id="playerMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 10; border: 1px solid #000; box-sizing: border-box;">
            <h2
                style="font-size: 36px; margin-top: 10px; margin-bottom: 15px; letter-spacing: 5px; text-shadow: 0 0 10px #290c9a;">
                PLAYER</h2>
            <div id="inventoryGrid"
                style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 90%; max-height: 320px; overflow-y: auto; padding: 10px; box-sizing: border-box; background: rgba(0,0,0,0.5); border: 1px solid #444;">
                @forelse($myItems as $item)
                    <div style="background: #222; padding: 10px; border: 1px solid #555; text-align: center;">
                        <div style="height: 40px; background: {{ $item->item_value ?? '#444' }}; margin-bottom: 8px;">
                        </div>
                        <p style="font-size: 14px; margin-bottom: 8px;">{{ $item->item_name }}</p>
                        @if ($item->item_type === 'skin')
                            <button class="equip-button" data-color="{{ $item->item_value }}"
                                style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer; font-size: 12px; width: 100%;">Equip</button>
                        @else
                            <button class="activate-button" data-item="{{ $item->item_name }}"
                                style="background: #0088ff; color: white; border: none; padding: 5px 10px; cursor: pointer; font-size: 12px; width: 100%;">Activate</button>
                        @endif
                    </div>
                @empty
                    <p style="grid-column: span 3; padding: 20px;">You don't own any items yet.</p>
                @endforelse
            </div>
            <button id="closePlayerMenuButton"
                style="margin-top: 20px; padding: 10px 30px; font-size: 18px; cursor: pointer; background-color: #555; color: white; border: none; border-radius: 5px;">Back</button>
        </div>

        <!-- Store Menu Overlay -->
        <div id="storeMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.95); display: none; flex-direction: column; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 15; border: 1px solid #000; box-sizing: border-box; padding: 20px;">
            <h2
                style="font-size: 36px; margin-top: 10px; margin-bottom: 15px; letter-spacing: 5px; text-shadow: 0 0 10px #290c9a;">
                STORE</h2>

            <h2>Total Coins: <span id="storeCoinsVal"
                    style="color: #ff0; font-size: 24px; margin-bottom: 10px;">{{ $totalCoins }}</span></h2>

            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <button id="skinsTab"
                    style="padding: 8px 20px; font-size: 16px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 3px;">Skins</button>
                <button id="upgradesTab"
                    style="padding: 8px 20px; font-size: 16px; cursor: pointer; background-color: #444; color: white; border: none; border-radius: 3px;">Upgrades</button>
            </div>

            <!-- Skins Section -->
            <div id="skinsSection"
                style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 90%; max-height: 320px; overflow-y: auto; padding: 10px; box-sizing: border-box;">
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div style="height: 50px; background: #08ea66; margin-bottom: 10px;"></div>
                    <p>Earth Ship</p>
                    <button class="buy-button" data-type="skin" data-color="#08ea66" data-price="100"
                        data-name="Earth Ship"
                        style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer;">100
                        Coins</button>
                </div>
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div style="height: 50px; background: #e2f208; margin-bottom: 10px;"></div>
                    <p>Sun Ship</p>
                    <button class="buy-button" data-type="skin" data-color="#e2f208" data-price="100"
                        data-name="Sun Ship"
                        style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer;">100
                        Coins</button>
                </div>
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div style="height: 50px; background: #818583; margin-bottom: 10px;"></div>
                    <p>Moon Ship</p>
                    <button class="buy-button" data-type="skin" data-color="#818583" data-price="100"
                        data-name="Moon Ship"
                        style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer;">100
                        Coins</button>
                </div>
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div style="height: 50px; background: #d40808; margin-bottom: 10px;"></div>
                    <p>Mars Ship</p>
                    <button class="buy-button" data-type="skin" data-color="#d40808" data-price="100"
                        data-name="Mars Ship"
                        style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer;">100
                        Coins</button>
                </div>
            </div>

            <!-- Upgrades Section -->
            <div id="upgradesSection"
                style="display: none; grid-template-columns: repeat(3, 1fr); gap: 15px; width: 90%; max-height: 320px; overflow-y: auto; padding: 10px; box-sizing: border-box;">
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div
                        style="height: 50px; display:flex; align-items:center; justify-content:center; background: #0088ff; border-radius:50%; margin-bottom: 10px; font-size:30px;">
                        🛡️</div>
                    <p>Energy Shield</p>
                    <button class="buy-button" data-type="upgrade" data-item="shield" data-price="250"
                        data-name="Energy Shield"
                        style="background: #290c9a; color: white; border: none; padding: 5px 10px; cursor: pointer;">250
                        Coins</button>
                </div>
                <div style="background: #222; padding: 10px; border: 1px solid #444; text-align: center;">
                    <div
                        style="height: 50px; display:flex; align-items:center; justify-content:center; background: #ff4400; margin-bottom: 10px; font-size:30px;">
                        🔫</div>
                    <p>Plasma Cannon</p>
                    <button class="buy-button" data-type="upgrade" data-item="weapon" data-price="500"
                        data-name="Plasma Cannon"
                        style="background: #505052; color: white; border: none; padding: 5px 10px; cursor: pointer;">closed</button>
                </div>
            </div>

            <button id="closeStoreButton"
                style="margin-top: 20px; padding: 10px 30px; font-size: 18px; cursor: pointer; background-color: #555; color: white; border: none; border-radius: 5px;">Back</button>
        </div>

        <!-- Pause Menu Overlay -->
        <div id="pauseMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 10; border: 1px solid #000; box-sizing: border-box;">
            <h2 style="font-size: 48px; margin-bottom: 30px; letter-spacing: 5px; text-shadow: 0 0 10px #290c9a;">
                PAUSED
            </h2>
            <button id="resumeButton"
                style="padding: 15px 30px; font-size: 18px; margin-bottom: 15px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px;">Resume
                Game</button>
            <button id="pauseQuitButton"
                style="padding: 15px 30px; font-size: 18px; cursor: pointer; background-color: #555; color: white; border: none; border-radius: 5px;">Quit
                Game</button>
        </div>

        <!-- Game Over Menu Overlay -->
        <div id="gameOverMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 10; border: 1px solid #000; box-sizing: border-box;">
            <h2 style="font-size: 48px; margin-bottom: 10px; letter-spacing: 5px; text-shadow: 0 0 10px #f00;">GAME
                OVER
            </h2>
            <p style="font-size: 24px; margin-bottom: 30px;">Final Coins: <span id="finalCoinsVal">0</span></p>
            <button id="gameOverRestartButton"
                style="padding: 15px 30px; font-size: 18px; margin-bottom: 15px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px;">Restart
                Game</button>
            <button id="gameOverQuitButton"
                style="padding: 15px 30px; font-size: 18px; cursor: pointer; background-color: #555; color: white; border: none; border-radius: 5px;">Quit
                Game</button>
        </div>

        <!-- High Score Menu Overlay -->
        <div id="CoinsMenu"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); display: none; flex-direction: column; justify-content: center; align-items: center; color: #fff; font-family: 'Arial', sans-serif; z-index: 10; border: 1px solid #000; box-sizing: border-box;">
            <h2 style="font-size: 48px; margin-bottom: 30px; letter-spacing: 5px; text-shadow: 0 0 10px #ff0;">NUMBER
                OF
                COINS</h2>
            <p style="font-size: 24px; margin-bottom: 30px;">Coins: <span id="CoinsVal">0</span></p>
            <button id="CoinsRestartButton"
                style="padding: 15px 30px; font-size: 18px; margin-bottom: 15px; cursor: pointer; background-color: #290c9a; color: white; border: none; border-radius: 5px;">Restart
                Game</button>
            <button id="CoinsQuitButton"
                style="padding: 15px 30px; font-size: 18px; cursor: pointer; background-color: #555; color: white; border: none; border-radius: 5px;">Quit
                Game</button>
        </div>

    </div>

    <script src="{{ asset('js/game.js') }}"></script>

</body>

</html>

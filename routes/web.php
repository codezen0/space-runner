<?php

use Illuminate\Support\Facades\Route;
use App\Models\Score;
use App\Models\Purchase;
use Illuminate\Http\Request;

Route::get('/game', function () {
    $highScores = Score::orderBy('coins', 'desc')->take(5)->get();
    $totalCoins = Score::sum('coins');
    $myItems = Purchase::all();
    return view('game', compact('highScores', 'totalCoins', 'myItems'));
});

Route::post('/buy-skin', function (Request $request) {
    $totalBalance = Score::sum('coins');
    $price = $request->price;

    if ($totalBalance >= $price) {
        // Prevent duplicate purchases
        $alreadyOwned = Purchase::where('item_name', $request->name)->exists();
        if ($alreadyOwned) {
            return response()->json(['success' => false, 'message' => 'You already own this!'], 400);
        }

        Score::create(['coins' => -$price]);
        Purchase::create([
            'item_name' => $request->name,
            'item_type' => $request->type,
            'item_value' => $request->value ?? null
        ]);
        return response()->json(['success' => true]);
    }

    return response()->json(['success' => false, 'message' => 'insufficient funds!'], 400);
});

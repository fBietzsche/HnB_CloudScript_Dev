// #######################################################################################################################
/*  ___ _  _     ___ ___  ___  _____   __   __      _____     _____ ___ _   _ ___ _____
  |_ _| \| |   | __| _ \/ __|/ _ \ \ / /   \ \    / / __|   |_   _| _ \ | | / __|_   _|
   | || .` |   | _||   /\__ \ (_) \ V /     \ \/\/ /| _|      | | |   / |_| \__ \ | |
  |___|_|\_|   |___|_|_\|___/\___/ |_|       \_/\_/ |___|     |_| |_|_\\___/|___/ |_|
*/
// #######################################################################################################################
// This is the test build. Heavily under work in progress. Numbers will be changed.


const RobotCount = 4;
const WeaponCount = 16;
const WeaponMaxLevel = 10;
const BasicBoxTime = 3600;

const SlotCount = 3;

//Don't access directly. Call getBoombot function
const boombots = {
    0 : "MekaScorp",
    1 : "Sharkbot",
    2 : "RoboMantis",
    3 : "IronTurtle"
};

//Don't access directly. Call getWeapon function
const weapons = {
    0 : "msw_1",
    1 : "msw_2",
    2 : "msw_3",
    3 : "msw_4",
    4 : "sbw_1",
    5 : "sbw_2",
    6 : "sbw_3",
    7 : "sbw_4",
    8 : "rmw_1",
    9 : "rmw_2",
    10 : "rmw_3",
    11 : "rmw_4",
    12 : "itw_1",
    13 : "itw_2",
    14 : "itw_3",
    15 : "itw_4"
};

//Don't access directly. Call getMatchDuration function
const matchDurations = {
    "DeathMatch" : 150
};

function Slot(isReady, isAvailable, startTime, endTime){
    this.isReady = isReady;
    this.isAvailable = isAvailable;
    this.startTime = startTime;
    this.endTime = endTime;
}

function getWeapon(weapon)
{
    return (typeof weapon === "string") ? Object.keys(weapons).find(key => weapons[key] === weapon) : weapons[weapon];
}

function getBoombot(boombot)
{
    return (typeof boombot === "string") ? Object.keys(boombots).find(key => boombots[key] === boombot) : boombots[boombot];
}

function getMatchDuration(matchType) {
    return matchDurations[matchType]
}

function winCondition(winArgs) {
    //After win match
    //get player info
    let PlayerId = winArgs[0];
    let winnerPlayers = winArgs[1];
    let loserPlayers = winArgs[2];
    let drawPlayers = [];
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: PlayerId,
        "StatisticNames": "Trophy"
    });
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let trophy = JSON.parse(currentPlayerTrophy.Statistics[0].Value);
    let matchStats = JSON.parse(currentPlayerData.Data.matchStats.Value);
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    let ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    let accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    let doubleBattery = JSON.parse(currentPlayerData.Data.doubleBattery.Value);

    let equipped = JSON.parse(currentPlayerData.Data.equipped.Value);
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);

    let equippedBoomBotId = getBoombot(equipped[0]);
    let equippedWeaponId = (4 * equippedBoomBotId) + equipped[2] - 1;


    // TODO MAX Trophy
    let maxTrophy = currentPlayerData.Data.maxTrophy.Value;


    //TODO: un-hardcode these values
    let accountExpGained = 20
    let trophyChange = 9
    let tradedBattery = 0

    matchStats.winCount += 1;
    accountExp[1] += accountExpGained;

    let newTrophy = trophy + trophyChange;

    if (newTrophy > maxTrophy) {
        maxTrophy = newTrophy
    }

    itemLevel[equippedWeaponId][2] += trophyChange;

    //give booster if available
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });

    let reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    let oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB)

    let batteryGained = 0;

    if (reserveBooster >= 15) {
        batteryGained = 15;
    } else {
        batteryGained = reserveBooster
    }

    let isBoxGiven = 0;

    //check for slot availability, start timer
    for (i = 0; i < slots.length; i++) {
        if (slots[i].isAvailable === true) {
            let startTime = new Date().getTime() / 1000;
            let endTime = startTime + BasicBoxTime;
            slots[i].isAvailable = false;
            slots[i].startTime = startTime;
            slots[i].endTime = endTime;
            isBoxGiven = 1;
            break;
        } else {
            isBoxGiven = 0;
        }
    }
    //double battery checker
    if (doubleBattery <= batteryGained) {
        tradedBattery = doubleBattery + batteryGained;
        doubleBattery = 0;
    } else {
        doubleBattery = doubleBattery - batteryGained;
        tradedBattery = 2 * batteryGained;
    }
    if (5 == matchHistory.length) {
        matchHistory.pop();
    }
    let thisMatch = [new Date().toISOString(), winnerPlayers, loserPlayers, drawPlayers,
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch.matchId, accountExpGained, trophyChange, batteryGained]
    //TODO: change thisMatch to object from array.
    /*
    let thisMatch = {
        "date" : new Date().toISOString(),
        "winnerPlayers" : winnerPlayers,
        "loserPlayers" : loserPlayers,
        "drawPlayers" : drawPlayers,
        "oldBooster" : oldBooster,
        "tradedBattery" : tradedBattery,
        "isBoxGiven" : isBoxGiven,
        "trophy" : trophy,
        "newTrophy" : newTrophy,
        "matchId" : ongoingMatch.matchId,
        "accountExpGained" : accountExpGained,
        "trophyChange" : trophyChange,
        "batteryGained" : batteryGained
    };
    */
    matchHistory.unshift(thisMatch);
    //ongoingMatch = ["0", "0", "0", "0", 0]

    ongoingMatch.playerGameliftId = "0";
    ongoingMatch.matchId = "0";
    ongoingMatch.matchType = "0";
    ongoingMatch.address = "0";
    ongoingMatch.date = 0;

    let UpdateUserReadOnlyData = {
        PlayFabId: PlayerId,
        Data: {
            "slots": JSON.stringify(slots),
            "matchStats": JSON.stringify(matchStats),
            "matchHistory": JSON.stringify(matchHistory),
            "ongoingMatch": JSON.stringify(ongoingMatch),
            "accountExp": JSON.stringify(accountExp),
            "itemLevel": JSON.stringify(itemLevel),
            "maxTrophy": maxTrophy
        }
    }

    server.UpdateUserReadOnlyData(UpdateUserReadOnlyData);
}

function loseCondition(loseArgs) {
    var PlayerId = loseArgs[0];
    var winnerPlayers = loseArgs[1];
    var loserPlayers = loseArgs[2];
    var drawPlayers = [];
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    var currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: PlayerId,
        "StatisticNames": "Trophy"
    });
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    var matchStats = JSON.parse(currentPlayerData.Data.matchStats.Value);
    var ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    var trophy = JSON.parse(currentPlayerTrophy.Statistics[0].Value)
    var accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    var doubleBattery = JSON.parse(currentPlayerData.Data.doubleBattery.Value);

    let equipped = JSON.parse(currentPlayerData.Data.equipped.Value);
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let equippedBoomBotId = getBoombot(equipped[0]);
    let equippedWeaponId = (4 * equippedBoomBotId) + equipped[2] - 1


    var accountExpGained = 10
    var trophyChange = 0
    var tradedBattery = 0
    if (trophy >= 50) {
        trophyChange = (-1)*(1 + Math.floor(trophy / 100))
    }
    matchStats.loseCount += 1;
    accountExp[1] = accountExp[1] + accountExpGained;

    //TODO: potential bug? trophy will never be less than trophyChange

    if (trophy <= trophyChange) {
        var newTrophy = 0
    } else {
        var newTrophy = trophy + trophyChange;
    }

    if(itemLevel[equippedWeaponId][2] + trophyChange <= 0)
    {
        itemLevel[equippedWeaponId][2] = 0;
    }
    else
    {
        itemLevel[equippedWeaponId][2] += trophyChange;
    }


    var currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });
    var reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    var oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB)
    if (reserveBooster >= 5) {
        var batteryGained = 5;
    } else {
        var batteryGained = reserveBooster
    }
    //double battery checker
    if (doubleBattery <= batteryGained) {
        tradedBattery = doubleBattery + batteryGained;
        doubleBattery = 0;
    } else {
        doubleBattery = doubleBattery - batteryGained;
        tradedBattery = 2 * batteryGained;
    }
    if (5 == matchHistory.length) {
        matchHistory.pop();
    }
    var isBoxGiven = 0;
    var thisMatch = [new Date().toISOString(), winnerPlayers, loserPlayers, drawPlayers,
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch.matchId, accountExpGained, trophyChange, batteryGained]
    matchHistory.unshift(thisMatch);
    //var ongoingMatch = ["0", "0", "0", "0", 0]

    ongoingMatch.playerGameliftId = "0";
    ongoingMatch.matchId = "0";
    ongoingMatch.matchType = "0";
    ongoingMatch.address = "0";
    ongoingMatch.date = 0;

    var updateUserData = {
        PlayFabId: PlayerId,
        Data: {
            "matchStats": JSON.stringify(matchStats),
            "matchHistory": JSON.stringify(matchHistory),
            "ongoingMatch": JSON.stringify(ongoingMatch),
            "accountExp": JSON.stringify(accountExp),
            "itemLevel": JSON.stringify(itemLevel),
        }
    }
    server.UpdateUserReadOnlyData(updateUserData);
}

function drawCondition(drawArgs) {
    var PlayerId = drawArgs[0];
    var drawPlayers = drawArgs[1];
    var winnerPlayers = [];
    var loserPlayers = [];
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    var currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: PlayerId,
        "StatisticNames": "Trophy"
    });
    var trophy = JSON.parse(currentPlayerTrophy.Statistics[0].Value)
    var newTrophy = trophy;
    var currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });
    var matchStats = JSON.parse(currentPlayerData.Data.matchStats.Value);
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    var ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    var accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    var reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    var oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB)
    var doubleBattery = JSON.parse(currentPlayerData.Data.doubleBattery.Value);
    var accountExpGained = 15
    var trophyChange = 0
    var tradedBattery = 0
    accountExp[1] = accountExp[1] + accountExpGained;
    matchStats.drawCount += 1;
    if (reserveBooster >= 10) {
        var batteryGained = 10;
    } else {
        var batteryGained = reserveBooster
    }
    //double battery checker
    if (doubleBattery <= batteryGained) {
        tradedBattery = doubleBattery + batteryGained;
        doubleBattery = 0;
    } else {
        doubleBattery = doubleBattery - batteryGained;
        tradedBattery = 2 * batteryGained;
    }
    if (5 == matchHistory.length) {
        matchHistory.pop();
    }
    var isBoxGiven = 0;
    var thisMatch = [new Date().toISOString(), winnerPlayers, loserPlayers, drawPlayers,
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch[1], accountExpGained, trophyChange, batteryGained]
    matchHistory.unshift(thisMatch);
    //var ongoingMatch = ["0", "0", "0", "0", 0]

    ongoingMatch.playerGameliftId = "0";
    ongoingMatch.matchId = "0";
    ongoingMatch.matchType = "0";
    ongoingMatch.address = "0";
    ongoingMatch.date = 0;

    var updateUserData = {
        PlayFabId: PlayerId,
        Data: {
            "matchStats": JSON.stringify(matchStats),
            "matchHistory": JSON.stringify(matchHistory),
            "ongoingMatch": JSON.stringify(ongoingMatch),
            "accountExp": JSON.stringify(accountExp),
            "doubleBattery": doubleBattery
        }
    }
    server.UpdateUserReadOnlyData(updateUserData);
}

function winConditionUpdate(winArgs) {
    log.debug("winConditionUpdate")
    var PlayerId = winArgs;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    var tradedBattery = matchHistory[0][5];
    var batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {

        var subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        var addBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "TB",
            Amount: tradedBattery
        }

        server.SubtractUserVirtualCurrency(subBooster);
        server.AddUserVirtualCurrency(addBooster);
    }
    //new trophy update
    var newTrophy = matchHistory[0][8];
    server.UpdatePlayerStatistics({
        "PlayFabId": PlayerId,
        "Statistics": [
            {
                "StatisticName": "Trophy",
                "Value": newTrophy
            }
        ]
    })
}

function loseConditionUpdate(loseArgs) {
    var PlayerId = loseArgs;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    var tradedBattery = matchHistory[0][5];
    var batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {
        var subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        var addBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "TB",
            Amount: tradedBattery
        }

        server.SubtractUserVirtualCurrency(subBooster);
        server.AddUserVirtualCurrency(addBooster);
    }
    //new trophy update
    var newTrophy = matchHistory[0][8];
    server.UpdatePlayerStatistics({
        "PlayFabId": PlayerId,
        "Statistics": [
            {
                "StatisticName": "Trophy",
                "Value": newTrophy
            }
        ]
    })
}

function drawConditionUpdate(drawArgs) {
    var PlayerId = drawArgs;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    var tradedBattery = matchHistory[0][5];
    var batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {
        var subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        var addBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "TB",
            Amount: tradedBattery
        }
        server.SubtractUserVirtualCurrency(subBooster);
        server.AddUserVirtualCurrency(addBooster);
    }
}

function accountLevelUpCheck() {

    //Get data
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "accountLevel"
    });

    //Set data
    var doubleBatteryTotal = JSON.parse(currentPlayerData.Data.doubleBattery.Value);
    var accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    var accountLevel = JSON.parse(titleData.Data.accountLevel);
    var isLevelUp = 0;
    var doubleBatteryFromLevelUp = 0;

    //if OK level up and give double battery
    log.debug("required exp = " + Math.floor(30 * Math.pow(accountExp[0], 1.05)))
    if (accountExp[1] >= Math.floor(30 * Math.pow(accountExp[0], 1.05))) {
        accountExp[0] = accountExp[0] + 1
        doubleBatteryFromLevelUp = 20
        doubleBatteryTotal += doubleBatteryFromLevelUp;
        var accLevelUp = {
            PlayFabId: currentPlayerId,
            Data: {
                "accountExp": JSON.stringify(accountExp),
                "doubleBattery": JSON.stringify(doubleBatteryTotal)
            }
        }
        server.UpdateUserReadOnlyData(accLevelUp);
        isLevelUp = 1
    }
    var currentAccLevel = accountExp[0]
    var currentAccExp = accountExp[1]
    var requiredAccExp = accountLevel[currentAccLevel]
    return [isLevelUp, doubleBatteryFromLevelUp, doubleBatteryTotal, currentAccLevel, currentAccExp, requiredAccExp]
}

handlers.grantMultipleItems = function(args){
    let itemIds = [];
    let itemId = args.itemId;
    let amount = args.amount;
    for (let i = 0; i < amount; i++){
        itemIds.push(itemId);
    }


    let itemToGrant = {
        "PlayFabId": currentPlayerId,
        "CatalogVersion": "Items",
        "ItemIds": itemIds
    };
    server.GrantItemsToUser(itemToGrant);
}


handlers.UnlockReward = function (args) {

    /*
     {
       "RewardIndex": "0",
     }
     */

    const RewardIndex = args.RewardIndex ? args.RewardIndex : null;

    const currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });

    log.debug("currentPlayerData  =  " + currentPlayerData.Data);

    const titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["progressRewards"]
    });

    log.debug("titleData  =  " + titleData);

    let maxTrophy = currentPlayerData.Data.maxTrophy.Value;

    log.debug("MaxTrophy  =  " + maxTrophy.Data);

    const lastRewardedProgressIndex = currentPlayerData.Data.lastRewardedProgressIndex.Value;

    log.debug("lastRewardedProgressIndex  =  " + lastRewardedProgressIndex.Data);

    if (RewardIndex && RewardIndex > lastRewardedProgressIndex) {


        if (titleData.Data.progressRewards[RewardIndex].ReqThropy <= maxTrophy) {

            // verdik

            if (titleData.Data.progressRewards[RewardIndex].Reward === "BasicBox") {

                const grantBasicKeyAndBox = {
                    PlayFabId: currentPlayerId,
                    ItemIds: [titleData.Data.progressRewards[RewardIndex].Reward, "BasicBoxKey"]
                }

                server.GrantItemsToUser(grantBasicKeyAndBox);

            } else {

                const grantReward = {
                    PlayFabId: currentPlayerId,
                    ItemIds: [titleData.Data.progressRewards[RewardIndex].Reward]
                }

                server.GrantItemsToUser(grantReward);
            }

            const updateUserReadOnly = {
                PlayFabId: currentPlayerId,
                Data: {
                    "lastRewardedProgressIndex": RewardIndex,
                }
            }
            server.UpdateUserReadOnlyData(updateUserReadOnly);

            return { "isRewarded": 1 }


        }
    }

    return { "isRewarded": 0 }

    // +++++ TODO check last reward index greater than now?
    // +++++ TODO check if user can unlock this reward.
    // +++++ TODO grant reward to user
    // +++++ TODO return { isRewarded : 1}

}

handlers.Debug = function () {
    var userData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["levelData", "weaponValues"]
    });
    log.debug("userData  =  " + userData)
    log.debug("titleData  =  " + titleData)
    var itemLevel = JSON.parse(userData.Data.itemLevel.Value);
    log.debug("itemLevel  =  " + itemLevel)
    var levelData = JSON.parse(titleData.Data.levelData)
    log.debug("levelData  =  " + levelData)
    var weaponData = titleData.Data.weaponValues;
    log.debug("weaponData  =  " + weaponData)
}

handlers.AddNewRobot = function () {
    //TODO Yeni exp sistemine göre güncellenecek
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var itemLevel = []
    var configs = []
    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    var configs = JSON.parse(currentPlayerData.Data.configs.Value)
    var itemLevelBase = [
        1,
        0
    ]
    var configsBase = [
        1,
        1,
        1,
        0
    ]
    for (var i = 0; i < 4; i++) {
        itemLevel.push(itemLevelBase)
    }
    configs.push(configsBase)
    var updateUserReadOnly = {
        PlayFabId: currentPlayerId,
        Data: {
            "configs": JSON.stringify(configs),
            "itemLevel": JSON.stringify(itemLevel)
        }
    }
    server.UpdateUserReadOnlyData(updateUserReadOnly);
}

handlers.SlotTester = function (args) {
    /*{
        "slot": "0",
        "timer": seconds
    }*/
    args.slot = !args.slot ? {} : args.slot;
    args.timer = !args.timer ? {} : args.timer;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });

    var starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);
    var currentTutorialProgress = JSON.parse(currentPlayerData.Data.tutorialProgress.Value);
    if (currentTutorialProgress == 2 || currentTutorialProgress == 6) {
        {
            var slots = JSON.parse(currentPlayerData.Data.slots.Value);
            var whichSlot = args.slot;
            var timer = args.timer;

            slots[whichSlot].isReady = false;
            slots[whichSlot].isAvailable = false;
            slots[whichSlot].startTime = new Date().getTime() / 1000;
            slots[whichSlot].endTime = slots[whichSlot].startTime + timer;
            /*slots[whichSlot] = [
                0,
                0,
                (new Date().getTime() / 1000),
                (new Date().getTime() / 1000) + timer
            ]*/
            starterBoxProgress = currentTutorialProgress == 2 ? 1 : 2;
            var updateUserReadOnly = {
                PlayFabId: currentPlayerId,
                Data: {
                    "slots": JSON.stringify(slots),
                    "starterBoxProgress": JSON.stringify(starterBoxProgress)
                }
            }
            server.UpdateUserReadOnlyData(updateUserReadOnly);
        }
    }
}

handlers.FirstLogin = function () {
    //TODO yeni exp sistemine göre güncellenecek
    /*{
        "isReady": 0,
        "isAvailable": 1,
        "startTime": 0,
        "endTime": 0
    }*/

    // TODO Max Trophy
    let maxTrophy = 0;
    let lastRewardedProgressIndex = 0;
    let starterBoxProgress = 0;
    let accountExp = [1, 0];
    let doubleBattery = 0;

    let slots = [];
    for (let j = 0; j < SlotCount; j++) {
        slots.push(new Slot(false, true, 0, 0));
    }
    let itemLevelBase = [
        0,
        0,
        0
    ];
    let configsBase = [
        1,
        1,
        1,
        0
    ];
    let itemLevel = [];
    let configs = [];
    for (let k = 0; k < RobotCount; k++) {
        if (k == 0) {
            configs[0] = [
                1,
                1,
                1,
                1
            ];
        } else {
            configs.push(configsBase);
        }
    }
    for (let i = 0; i < WeaponCount; i++) {
        if (i == 0) {
            itemLevel[0] = [
                1,
                0,
                0
            ];
        } else {
            itemLevel.push(itemLevelBase);
        }
    }
    //log.debug("configs b = " + configs)
    //itemLevel[0][0] = 1;
    //configs[0][3] = 1;
    log.debug("configs a = " + configs);
    log.debug("itemlevel = " + itemLevel);
    let equipped = [
        "MekaScorp",
        1,
        1,
        1
    ];

    /*let matchStats = [
        0, 0, 0
    ];*/

    let matchStats = {
        "winCount" : 0,
        "loseCount" : 0,
        "drawCount" : 0
    };

    let tutorialProgress = 0;
    let matchHistory = [];
    let updateUserReadOnly = {
        PlayFabId: currentPlayerId,
        Data: {
            "equipped": JSON.stringify(equipped),
            "configs": JSON.stringify(configs),
            "itemLevel": JSON.stringify(itemLevel),
            "slots": JSON.stringify(slots),
            "matchStats": JSON.stringify(matchStats),
            "matchHistory": JSON.stringify(matchHistory),
            "accountExp": JSON.stringify(accountExp),
            "doubleBattery": JSON.stringify(doubleBattery),
            "tutorialProgress": JSON.stringify(tutorialProgress),
            "starterBoxProgress": JSON.stringify(starterBoxProgress)
        }
    };
    let updateUserReadOnly2 = {
        PlayFabId: currentPlayerId,
        Data: {
            "maxTrophy": JSON.stringify(maxTrophy),
            "lastRewardedProgressIndex": JSON.stringify(lastRewardedProgressIndex)
        }
    };
    server.UpdatePlayerStatistics({
        "PlayFabId": currentPlayerId,
        "Statistics": [
            {
                "StatisticName": "Trophy",
                "Value": 0
            }
        ]
    });

    server.UpdateUserReadOnlyData(updateUserReadOnly);
    server.UpdateUserReadOnlyData(updateUserReadOnly2);

}

handlers.CheckSlots = function (args) {
    //{Box : boxId}
    //Every time main screen loaded or booster used for accelerate box opening
    //get player info
    let BoxType = args.Box;
    let isTutorial = 0;
    let timer = [0, 0, 0];
    let isAvailable = [false, false, false];
    let currentPlayerData = server.GetUserReadOnlyData({
        "PlayFabId": currentPlayerId
    });
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let currentTutorialProgress = JSON.parse(currentPlayerData.Data.tutorialProgress.Value);
    let starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);

    //check for remaining time and give key
    for (i = 0; i < SlotCount; i++) {
        let remainingTime = slots[i].endTime - (new Date().getTime() / 1000);
        isAvailable[i] = slots[i].isAvailable;

        if ((remainingTime <= 0) && (isAvailable[i] === false)) {
            //reset slot
            slots[i].isReady = false;
            slots[i].isAvailable = true;
            slots[i].startTime = 0;
            slots[i].endTime = 0;

            if (starterBoxProgress == 2) {
                BoxType = "StarterBox";
                log.debug("currentTutorialProgress before " + currentTutorialProgress);
                currentTutorialProgress = currentTutorialProgress + 1;
                log.debug("after " + currentTutorialProgress);
                starterBoxProgress = starterBoxProgress + 1;
                let updateUserReadOnly = {
                    PlayFabId: currentPlayerId,
                    Data: {
                        "slots": JSON.stringify(slots),
                        "starterBoxProgress": JSON.stringify(starterBoxProgress),
                        "tutorialProgress": JSON.stringify(currentTutorialProgress)
                    }
                };
                let isTutorial = 1;
                server.UpdateUserReadOnlyData(updateUserReadOnly);
            }
            else {
                let updateSlotTimer = {
                    PlayFabId: currentPlayerId,
                    Data: { "slots": JSON.stringify(slots) }
                }
                server.UpdateUserReadOnlyData(updateSlotTimer);
            }

            let grantBasicKeyAndBox = {
                "PlayFabId": currentPlayerId,
                "ItemIds": ["BasicBoxKey", BoxType]
            }
            server.GrantItemsToUser(grantBasicKeyAndBox);
            timer[i] = 0

        } else if ((isAvailable[i] === true)) {
            timer[i] = -1;
        } else
            timer[i] = remainingTime;
    }

    return {
        "timer": timer,
        "isAvailable": isAvailable,
        "isTutorial": isTutorial
    }
}

handlers.EndMatch = function (args) {
    //End match functions handler
    /*args must be in this format:
        {
            "winnerPlayers":["x", "y", "z"],
            "loserPlayers":["x", "y", "z"],
            "drawPlayers":["x", "y", "z"]
        }
    */
    args.winnerPlayers = !args.winnerPlayers ? {} : args.winnerPlayers;
    args.loserPlayers = !args.loserPlayers ? {} : args.loserPlayers;
    args.drawPlayers = !args.drawPlayers ? {} : args.drawPlayers;

    var winnerPlayers = args.winnerPlayers;
    var loserPlayers = args.loserPlayers;
    var drawPlayers = args.drawPlayers;
    //Win
    for (i = 0; i < winnerPlayers.length; i++) {
        let winArgs = [winnerPlayers[i], winnerPlayers, loserPlayers];
        winCondition(winArgs)
    }

    //Lose
    for (i = 0; i < loserPlayers.length; i++) {
        let loseArgs = [loserPlayers[i], winnerPlayers, loserPlayers];
        loseCondition(loseArgs)
    }

    //Draw
    for (i = 0; i < drawPlayers.length; i++) {
        let drawArgs = [drawPlayers[i], drawPlayers];
        drawCondition(drawArgs)
    }
    return 1

}

handlers.EndMatchUpdate = function (args) {
    //End match functions handler
    /*args must be in this format:
        {
            "winnerPlayers":["x", "y", "z"],
            "loserPlayers":["x", "y", "z"],
            "drawPlayers":["x", "y", "z"]
        }
    */
    args.winnerPlayers = !args.winnerPlayers ? {} : args.winnerPlayers;
    args.loserPlayers = !args.loserPlayers ? {} : args.loserPlayers;
    args.drawPlayers = !args.drawPlayers ? {} : args.drawPlayers;

    var winnerPlayers = args.winnerPlayers;
    var loserPlayers = args.loserPlayers;
    var drawPlayers = args.drawPlayers;
    //Win
    for (i = 0; i < winnerPlayers.length; i++) {
        let winArgs = winnerPlayers[i];
        winConditionUpdate(winArgs)
    }

    //Lose
    for (i = 0; i < loserPlayers.length; i++) {
        let loseArgs = loserPlayers[i];
        loseConditionUpdate(loseArgs)
    }

    //Draw
    for (i = 0; i < drawPlayers.length; i++) {
        let drawArgs = drawPlayers[i];
        drawConditionUpdate(drawArgs)
    }
}

handlers.GetMatchResult = function () {

    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    var slots = JSON.parse(currentPlayerData.Data.slots.Value);
    var accountLevelUpCheckResult = accountLevelUpCheck()
    var availableSlotCount = 0

    for (i = 0; i < 3; i++) {
        if (slots[i].isAvailable === true) {
            availableSlotCount += 1
        }
    }
    return {
        "lastMatchResults": [[new Date().toISOString()], matchHistory[0], accountLevelUpCheckResult, availableSlotCount]
    }
}

handlers.SpendBoosterSlot = function (args) {
    args.Slot = !args.Slot ? {} : args.Slot;
    var whichSlot = args.Slot;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    var isUsed = 0;
    var playerBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB);
    var slots = JSON.parse(currentPlayerData.Data.slots.Value);
    var reqBooster = Math.ceil((slots[whichSlot][3] - (new Date().getTime() / 1000)) / 60);
    if (playerBooster >= reqBooster && slots[whichSlot][1] == 0 && reqBooster >= 1) {
        slots[whichSlot][3] = (new Date().getTime() / 1000);
        var subBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "TB",
            Amount: reqBooster
        }
        server.SubtractUserVirtualCurrency(subBooster);
        var updateSlotTimer = {
            PlayFabId: currentPlayerId,
            Data: { "slots": JSON.stringify(slots) }
        }
        server.UpdateUserReadOnlyData(updateSlotTimer);
        isUsed = 1
    }
    return { "isUsed": isUsed }
}

handlers.SpendRubySlot = function (args) {
    args.Slot = !args.Slot ? {} : args.Slot;
    var whichSlot = args.Slot;
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    var isUsed = 0;
    var playerRuby = JSON.parse(currentPlayerInventory.VirtualCurrency.RB);
    var slots = JSON.parse(currentPlayerData.Data.slots.Value);
    var reqRuby = Math.ceil((slots[whichSlot].endTime - (new Date().getTime() / 1000)) / 60);
    if (playerRuby >= reqRuby && slots[whichSlot].isAvailable === false && reqRuby >= 1) {
        slots[whichSlot].endTime = (new Date().getTime() / 1000);
        var subBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "RB",
            Amount: reqRuby
        }
        server.SubtractUserVirtualCurrency(subBooster);
        var updateSlotTimer = {
            PlayFabId: currentPlayerId,
            Data: { "slots": JSON.stringify(slots) }
        }
        server.UpdateUserReadOnlyData(updateSlotTimer);
        isUsed = 1
    }
    return { "isUsed": isUsed }

}

handlers.OpenBox = function (args) {
    //{Box : boxId}
    //when box ready, click to open function
    //get player info
    var boxType = args.Box;
    var openBox = {
        PlayFabId: currentPlayerId,
        ContainerItemId: boxType
    }
    var result = server.UnlockContainerItem(openBox);
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var configs = JSON.parse(currentPlayerData.Data.configs.Value);
    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    var grantedItemIds = []
    var grantedCoin = 0
    var isWeaponGranted = 0
    var isBoombotGranted = 0
    for (i = 0; i < result.GrantedItems.length; i++) {
        grantedItemIds.push(0)
        grantedItemIds[i] = result.GrantedItems[i].ItemId
        var itemClass = result.GrantedItems[i].ItemClass
        if (itemClass == "coinPack") {
            grantedCoin = grantedItemIds[i]
            grantedCoin = grantedCoin.slice(4, 20)
        } else if (itemClass == "exp") {
            var weaponName = grantedItemIds[i].slice(0, -4)
            var weaponId = getWeapon(weaponName)
            var boombotId = Math.floor(weaponId / 4)
            var boombotName = getBoombot(boombotId)
            // player got weapon?
            if (itemLevel[weaponId][0] == 0) {
                var isWeaponGranted = 1
                var grantItemsIds = [weaponName]
                //player got boombot?
                if (configs[boombotId][3] == 0) {
                    configs[boombotId][3] = 1
                    grantItemsIds.push(boombotName)
                    var isBoombotGranted = 1
                    configs[boombotId][0] = 1
                    configs[boombotId][1] = weaponId % 4 + 1
                    configs[boombotId][2] = 1
                    log.debug("weaponid " + configs[boombotId][1])
                }
                itemLevel[weaponId][0] = 1
                var updateUserReadOnly = {
                    PlayFabId: currentPlayerId,
                    Data: {
                        "configs": JSON.stringify(configs),
                        "itemLevel": JSON.stringify(itemLevel)
                    }
                }
                server.UpdateUserReadOnlyData(updateUserReadOnly);
                var grantItems = {
                    PlayFabId: currentPlayerId,
                    ItemIds: grantItemsIds
                }
                server.GrantItemsToUser(grantItems);
                var expAmount = 0
                var currentExp = 0
            } else {
                //Math.floor(Math.random() * (max - min + 1) ) + min;
                if (boxType == "StarterBox") {
                    var expAmount = Math.floor(Math.random() * (24 - 22 + 1)) + 22;
                }
                else {
                    var expAmount = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
                }
                itemLevel[weaponId][1] += expAmount;
                var updateUserReadOnly = {
                    PlayFabId: currentPlayerId,
                    Data: {
                        "itemLevel": JSON.stringify(itemLevel)
                    }
                }
                server.UpdateUserReadOnlyData(updateUserReadOnly);
                var currentExp = itemLevel[weaponId][1]
            }
        }
    }
    return {
        "isBoombotGranted": isBoombotGranted,
        "isWeaponGranted": isWeaponGranted,
        "whichBoombot": boombotId,
        "whichWeapon": weaponId,
        "grantedCoin": grantedCoin,
        "expAmount": expAmount,
        "currentExp": currentExp
    }
}

handlers.EquipItem = function (args) {
    //Garage equip item function
    /*args must be in this format:
        {
            "boombot":"BoomBot",
            "cos":1,
            "wpn":1,
            "wpnCos":1
        }
    */
    args.boombot = !args.boombot ? {} : args.boombot;
    args.cos = !args.cos ? {} : args.cos;
    args.wpn = !args.wpn ? {} : args.wpn;
    args.wpnCos = !args.wpnCos ? {} : args.wpnCos;

    //get player info
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
    });
    var boomBotId = getBoombot(args.boombot)
    var weaponId = (4 * boomBotId) + args.wpn - 1
    //select boombot values
    var equipped = JSON.parse(currentPlayerData.Data.equipped.Value);
    var configs = JSON.parse(currentPlayerData.Data.configs.Value);
    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    if (configs[boomBotId][3] == 1 && itemLevel[weaponId][0] >= 1) {
        equipped[0] = args.boombot;
        equipped[1] = args.cos;
        equipped[2] = args.wpn;
        equipped[3] = args.wpnCos;
        configs[boomBotId][0] = args.cos;
        configs[boomBotId][1] = args.wpn;
        configs[boomBotId][2] = args.wpnCos;
    }
    var updateEquippedItems = {
        PlayFabId: currentPlayerId,
        Data: {
            "equipped": JSON.stringify(equipped),
            "configs": JSON.stringify(configs)
        }
    }

    server.UpdateUserReadOnlyData(updateEquippedItems);
}
/*
handlers.GetUserGameplayConfig = function (args) {
    // Gameplay parameters sender function
    args.PlayerId = !args.PlayerId ? {} : args.PlayerId;

    var PlayerId = args.PlayerId;

    var accInfo = server.GetUserAccountInfo({
        PlayFabId: PlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: PlayerId,
        "Keys": ["levelData", "robotValues", "weaponValues"]
    });
    var userData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId,
        "Keys": ["equipped", "itemLevel"]
    });

    var titleInfo = accInfo.UserInfo.TitleInfo;
    var itemLevel = JSON.parse(userData.Data.itemLevel.Value);
    var weaponData = JSON.parse(titleData.Data.weaponValues);
    var currentEquipment = JSON.parse(userData.Data.equipped.Value);
    var boomBotId = getBoombot(currentEquipment[0])
    var weaponId = ((4 * boomBotId) + currentEquipment[2] - 1)
    var gameplayParams = {
        "DisplayName": titleInfo.DisplayName,
        "RobotId": currentEquipment[0],
        "RobotCostumeId": currentEquipment[1] - 1,
        "WeaponId": currentEquipment[2] - 1,
        "WeaponCostumeId": currentEquipment[3] - 1,
        "Damage": weaponData[weaponId][0] + (weaponData[weaponId][0] * (itemLevel[weaponId][0] - 1) * 0.05),
        "EnergyCost": weaponData[weaponId][1],
        "EnergyChargeRate": weaponData[weaponId][2],
        "UltDamageScale": weaponData[weaponId][3],
        "UltCharge": weaponData[weaponId][4],
        "MoveSpeedScale": weaponData[weaponId][5],
        "AltDamage": weaponData[weaponId][6] * (weaponData[weaponId][0] + (weaponData[weaponId][0] * (itemLevel[weaponId][0] - 1) * 0.05)),
        "HealthPoints": weaponData[weaponId][7] + (weaponData[weaponId][7] * (itemLevel[weaponId][0] - 1) * 0.05),
        "Cooldown": weaponData[weaponId][8]
    }
    return gameplayParams;
}
*/
handlers.GetUserGameParams = function () {

    var userData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["levelData", "weaponValues"]
    });
    var weaponData = JSON.parse(titleData.Data.weaponValues);
    var itemLevel = JSON.parse(userData.Data.itemLevel.Value);
    var levelData = JSON.parse(titleData.Data.levelData)
    var HP = []
    var DMG = []
    var nextLevel = []
    var nextExp = levelData.levelRamp;
    var nextCoin = levelData.levelCoin;
    for (i = 0; i < WeaponCount; i++) {
        nextLevel.push([])
        DMG.push([])
        HP[i] = weaponData[i][7] + (weaponData[i][7] * (itemLevel[i][0] - 1) * 0.05)
        nextLevel[i][0] = nextExp[itemLevel[i][0]]
        nextLevel[i][1] = nextCoin[itemLevel[i][0]]
        DMG[i] = Math.round(weaponData[i][0] + (weaponData[i][0] * (itemLevel[i][0] - 1) * 0.05))
    }
    var equipped = JSON.parse(userData.Data.equipped.Value)
    var configs = JSON.parse(userData.Data.configs.Value)
    var itemLevel = JSON.parse(userData.Data.itemLevel.Value)
    var gameParams = {
        "equipped": equipped,
        "configs": configs,
        "itemLevel": itemLevel,
        "HealthPoints": HP,
        "Damage": DMG,
        "nextLevel": nextLevel
    }
    return gameParams;
}
/*
handlers.CheckUpgrade = function () {
    //TODO Max level durumu eklenecek
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "levelData"
    });

    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    var levelData = JSON.parse(titleData.Data.levelData);
    var levelRamp = levelData.levelRamp;
    var levelCoin = levelData.levelCoin;
    var requiredExp = [];
    var requiredCoin = [];
    var currentExp = [];
    var checkResult = [];

    for (i = 0; i < WeaponCount; i++) {
        requiredExp.push(0)
        requiredCoin.push(0)
        currentExp.push(0)
        checkResult.push(0)
        if (itemLevel[i][0] == 10) {
            checkResult[i] = "max"
            currentExp[i] = "max"
            requiredExp[i] = "max"
            requiredCoin[i] = "max"
        } else {
            currentExp[i] = itemLevel[i][1];
            requiredExp[i] = levelRamp[itemLevel[i][0] - 1]
            requiredCoin[i] = levelCoin[itemLevel[i][0] - 1]
            if (requiredExp[i] <= currentExp[i]) {
                checkResult[i] = 1
            }
        }
    }
    return {
        "checkResult": checkResult,
        "currentExp": currentExp,
        "requiredExp": requiredExp,
        "requiredCoin": requiredCoin
    }
}
*/
handlers.UpgradeWeapon = function (args) {
    //usable when an boombot can be upgraded
    args.whichWeapon = !args.whichWeapon ? {} : args.whichWeapon;
    var whichWeapon = args.whichWeapon;
    //get user item info and VC
    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    var titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "levelData"
    });

    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    var playerCoin = JSON.parse(currentPlayerInventory.VirtualCurrency.CN);
    var levelData = JSON.parse(titleData.Data.levelData);
    var levelRamp = levelData.levelRamp;
    var levelCoin = levelData.levelCoin;
    var currentExp = itemLevel[whichWeapon][1];
    var requiredExp = levelRamp[itemLevel[whichWeapon][0] - 1]
    var requiredCoin = levelCoin[itemLevel[whichWeapon][0] - 1]
    var isUpgraded = 0

    //if OK level up
    if (itemLevel[whichWeapon][0] <= 9) {
        if ((playerCoin >= requiredCoin) && (currentExp >= requiredExp)) {
            itemLevel[whichWeapon][1] -= requiredExp
            itemLevel[whichWeapon][0] += 1;
            currentExp = itemLevel[whichWeapon][1]
            var upgradeItem = {
                PlayFabId: currentPlayerId,
                Data: { "itemLevel": JSON.stringify(itemLevel) }
            }
            server.UpdateUserReadOnlyData(upgradeItem);
            var subCoin = {
                PlayFabId: currentPlayerId,
                VirtualCurrency: "CN",
                Amount: requiredCoin
            }
            server.SubtractUserVirtualCurrency(subCoin);
            isUpgraded = 1
        }

    }
    return {
        "isUpgraded": isUpgraded,
        "currentExp": currentExp
    }
}

handlers.OnMatchStart = function (args) {
    /*
    {
        "PlayerGameliftId":"asd",
        "MatchId":"asd",
        "MatchType":"DeathMatch",
        "Adress":"asd"
    }
    */
    args.PlayerGameliftId = !args.PlayerGameliftId ? {} : args.PlayerGameliftId;
    args.MatchId = !args.MatchId ? {} : args.MatchId;
    args.MatchType = !args.MatchType ? {} : args.MatchType;
    args.Adress = !args.Adress ? {} : args.Adress;

    //var ongoingMatch = [0, 0, 0, 0, 0]

    let ongoingMatch = {
        "playerGameliftId" : args.PlayerGameliftId,
        "matchId" : args.MatchId,
        "matchType" : args.MatchType,
        "address" : args.Adress,
        "date" :  new Date().getTime() / 1000
    };

    /*ongoingMatch[0] = args.PlayerGameliftId
    ongoingMatch[1] = args.MatchId
    ongoingMatch[2] = args.MatchType
    ongoingMatch[3] = args.Adress
    ongoingMatch[4] = new Date().getTime() / 1000*/
    var UpdateUserReadOnlyData = {
        PlayFabId: currentPlayerId,
        Data: {
            "ongoingMatch": JSON.stringify(ongoingMatch)
        }
    }
    server.UpdateUserReadOnlyData(UpdateUserReadOnlyData);
}

handlers.GetOngoingMatch = function () {

    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    return {
        "PlayerGameliftId": ongoingMatch.playerGameliftId,
        "Adress": ongoingMatch.address
    };
    /*   var matchDuration = getMatchDuration(ongoingMatch[2])
       var matchEndTime = ongoingMatch[4] + matchDuration
       if (matchEndTime > ((new Date().getTime() / 1000) + 15)) {
          var reconnectData = {
               "PlayerGameliftId": ongoingMatch[0],
               "Adress": ongoingMatch[3]
           }
       }
       else {
           var reconnectData = {
               "PlayerGameliftId": "0",
               "Adress": "0"
           }
       }*/
}

handlers.GetCurrentEquipment = function () {

    var currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    var itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    var equipped = JSON.parse(currentPlayerData.Data.equipped.Value);

    var equipments = {
        "boombot": getBoombot(equipped[0]),
        "boombotCostume": equipped[1],
        "weapon": equipped[2],
        "weaponCostume": equipped[3],
        "itemLevel": itemLevel[equipped[2]][0]
    }
    return equipments
}

handlers.FinishTutorial = function (args) {

    var currentPlayerData = server.GetUserReadOnlyData({ PlayFabId: currentPlayerId });
    var currentTutorialProgress = JSON.parse(currentPlayerData.Data.tutorialProgress.Value);
    var starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);
    currentTutorialProgress = args.Value;
    /*var UpdateUserReadOnlyData =
    {
        PlayFabId: currentPlayerId,
        Data: {
            "tutorialProgress": JSON.stringify(currentTutorialProgress)
        }
    }
    server.UpdateUserReadOnlyData(UpdateUserReadOnlyData);
    */
    if (currentTutorialProgress == 5 && starterBoxProgress == 0) {
        var slots = JSON.parse(currentPlayerData.Data.slots.Value);

        slots[0].isReady = false;
        slots[0].isAvailable = false;
        slots[0].startTime = (new Date().getTime() / 1000);
        slots[0].endTime = slots[0].startTime + BasicBoxTime;

        starterBoxProgress = 1

    }
    if (currentTutorialProgress == 5 && starterBoxProgress == 1) {
        //todo add player data check if it was given before to ensure only once adding of batteries
        var addBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "TB",
            Amount: 60
        }
        server.AddUserVirtualCurrency(addBooster);
        starterBoxProgress = 2
    }
    var updateUserReadOnly = {
        PlayFabId: currentPlayerId,
        Data: {
            "slots": JSON.stringify(slots),
            "starterBoxProgress": JSON.stringify(starterBoxProgress),
            "tutorialProgress": JSON.stringify(currentTutorialProgress)
        }
    }
    server.UpdateUserReadOnlyData(updateUserReadOnly);
}

handlers.GetTutorialProgress = function () {
    var currentPlayerData = server.GetUserReadOnlyData({ PlayFabId: currentPlayerId });
    var currentTutorialProgress = currentPlayerData.Data.tutorialProgress;
    return currentTutorialProgress;
}


handlers.GetWeaponsData = function ()
{
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "levelData"
    });

    let itemLevels = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let levelData = JSON.parse(titleData.Data.levelData);
    let levelRamps = levelData.levelRamp;
    let levelCoins = levelData.levelCoin;

    let requiredEXPToUpgrade = [];
    let requiredCoinToUpgrade = [];
    let currentEXPs = [];
    let currentLevels = [];
    let currentTrophies = [];
    let canUpgrade = [];

    for(let i = 0; i < WeaponCount; i++)
    {
        if(itemLevels[i][0] >= WeaponMaxLevel)
        {
            canUpgrade.push(false);
            currentLevels.push(WeaponMaxLevel);
            currentEXPs.push(-1);
            requiredEXPToUpgrade.push(-1);
            requiredCoinToUpgrade.push(-1);
        }
        else
        {
            currentLevels.push(itemLevels[i][0]);
            currentEXPs.push(itemLevels[i][1]);

            if(itemLevels[i][0] !== 0)
            {
                requiredEXPToUpgrade.push(parseInt(levelRamps[itemLevels[i][0] - 1]));
                requiredCoinToUpgrade.push(parseInt(levelCoins[itemLevels[i][0] - 1]));
                canUpgrade.push(requiredEXPToUpgrade[i] <= currentEXPs[i]);
            }
            else
            {
                requiredEXPToUpgrade.push(0);
                requiredCoinToUpgrade.push(0);
                canUpgrade.push(false);
            }
        }
        currentTrophies.push(itemLevels[i][2] ? itemLevels[i][2] : 0);
    }

    return {
        "canUpgrade": canUpgrade,
        "currentLevel" : currentLevels,
        "currentExp": currentEXPs,
        "currentTrophy" : currentTrophies,
        "requiredExp": requiredEXPToUpgrade,
        "requiredCoin": requiredCoinToUpgrade
    }
}



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

//weapon values (HP, damage, etc.) will be modified with this value
const WeaponLevelUpValueModifier = 0.05;

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

function getWeapon(weapon) {
    return (typeof weapon === "string") ? parseInt(Object.keys(weapons).find(key => weapons[key] === weapon)) : weapons[weapon];
}

function getBoombot(boombot) {
    return (typeof boombot === "string") ? parseInt(Object.keys(boombots).find(key => boombots[key] === boombot)) : boombots[boombot];
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
    let MVP = winArgs[3];
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

    let equippedBoomBotId = equipped.boombotId;
    let equippedWeaponId = (4 * equippedBoomBotId) + equipped.weapon - 1;


    // TODO MAX Trophy
    let maxTrophy = currentPlayerData.Data.maxTrophy.Value;

    let accountExpGained = 20;
    let trophyChange = 9;
    let tradedBattery = 0;

    matchStats.winCount += 1;
    accountExp[1] += accountExpGained;

    let newTrophy = trophy + trophyChange;

    if (newTrophy > maxTrophy) {
        maxTrophy = newTrophy;
    }

    itemLevel[equippedWeaponId].weaponTrophy += trophyChange;

    //give booster if available
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });

    let reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    let oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB);

    let batteryGained = 0;

    if (reserveBooster >= 15) {
        batteryGained = 15;
    } else {
        batteryGained = reserveBooster;
    }

    let isBoxGiven = 0;

    //check for slot availability, start timer
    for (i = 0; i < slots.length; i++) {
        if (slots[i].isAvailable === true) {
            let startTime = getTimeInSeconds();
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
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch[1], accountExpGained, trophyChange, batteryGained];

    matchHistory.unshift(thisMatch);
    //ongoingMatch = ["0", "0", "0", "0", 0]

    ongoingMatch = ["0", "0", "0", "0", 0];

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
    };

    server.UpdateUserReadOnlyData(UpdateUserReadOnlyData);
}

function loseCondition(loseArgs) {
    let PlayerId = loseArgs[0];
    let winnerPlayers = loseArgs[1];
    let loserPlayers = loseArgs[2];
    let MVP = loseArgs[3];
    let drawPlayers = [];
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: PlayerId,
        "StatisticNames": "Trophy"
    });
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    let matchStats = JSON.parse(currentPlayerData.Data.matchStats.Value);
    let ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    let trophy = JSON.parse(currentPlayerTrophy.Statistics[0].Value)
    let accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    let doubleBattery = JSON.parse(currentPlayerData.Data.doubleBattery.Value);

    let equipped = JSON.parse(currentPlayerData.Data.equipped.Value);
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let equippedBoomBotId = equipped.boombotId;
    let equippedWeaponId = (4 * equippedBoomBotId) + equipped.weapon - 1;


    let accountExpGained = 10;
    let trophyChange = 0;
    let tradedBattery = 0;

    if (trophy >= 50) {
        trophyChange = (-1)*(1 + Math.floor(trophy / 100));
    }
    matchStats.loseCount += 1;
    accountExp[1] += accountExpGained;

    let newTrophy = (trophy <= trophyChange) ? 0 : trophy + trophyChange;

    if(itemLevel[equippedWeaponId].weaponTrophy + trophyChange <= 0)
    {
        itemLevel[equippedWeaponId].weaponTrophy = 0;
    }
    else
    {
        itemLevel[equippedWeaponId].weaponTrophy += trophyChange;
    }


    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });
    let reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    let oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB)

    let batteryGained = (reserveBooster >= 5) ? 5 : reserveBooster;

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
    let isBoxGiven = 0;
    let thisMatch = [new Date().toISOString(), winnerPlayers, loserPlayers, drawPlayers,
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch[1], accountExpGained, trophyChange, batteryGained]


    matchHistory.unshift(thisMatch);
    //var ongoingMatch = ["0", "0", "0", "0", 0]


    ongoingMatch = ["0", "0", "0", "0", 0];

    let updateUserData = {
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
    let PlayerId = drawArgs[0];
    let drawPlayers = drawArgs[1];
    let MVP = drawArgs[2];
    let winnerPlayers = [];
    let loserPlayers = [];
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: PlayerId,
        "StatisticNames": "Trophy"
    });
    let trophy = JSON.parse(currentPlayerTrophy.Statistics[0].Value)
    let newTrophy = trophy;
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: PlayerId
    });
    let matchStats = JSON.parse(currentPlayerData.Data.matchStats.Value);
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    let ongoingMatch = JSON.parse(currentPlayerData.Data.ongoingMatch.Value);
    let accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    let reserveBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.BR);
    let oldBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB)
    let doubleBattery = JSON.parse(currentPlayerData.Data.doubleBattery.Value);
    let accountExpGained = 15;
    let trophyChange = 0;
    let tradedBattery = 0;
    accountExp[1] = accountExp[1] + accountExpGained;
    matchStats.drawCount += 1;

    let batteryGained = (reserveBooster >= 10) ? 10 : reserveBooster;

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
    let isBoxGiven = 0;
    let thisMatch = [new Date().toISOString(), winnerPlayers, loserPlayers, drawPlayers,
        oldBooster, tradedBattery, isBoxGiven, trophy, newTrophy, ongoingMatch[1], accountExpGained, trophyChange, batteryGained]

    matchHistory.unshift(thisMatch);
    //var ongoingMatch = ["0", "0", "0", "0", 0]


    ongoingMatch = ["0", "0", "0", "0", 0];

    let updateUserData = {
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
    let PlayerId = winArgs;
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    let tradedBattery = matchHistory[0][5];
    let batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {

        let subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        let addBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "TB",
            Amount: tradedBattery
        }

        server.SubtractUserVirtualCurrency(subBooster);
        server.AddUserVirtualCurrency(addBooster);
    }
    //new trophy update
    let newTrophy = matchHistory[0][8];
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
    let PlayerId = loseArgs;
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    let tradedBattery = matchHistory[0][5];
    let batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {
        let subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        let addBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "TB",
            Amount: tradedBattery
        }

        server.SubtractUserVirtualCurrency(subBooster);
        server.AddUserVirtualCurrency(addBooster);
    }
    //new trophy update
    let newTrophy = matchHistory[0][8];
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
    let PlayerId = drawArgs;
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: PlayerId
    });
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    //give booster if available
    let tradedBattery = matchHistory[0][5];
    let batteryGained = matchHistory[0][12];
    if (tradedBattery >= 1) {
        let subBooster = {
            PlayFabId: PlayerId,
            VirtualCurrency: "BR",
            Amount: batteryGained
        }
        let addBooster = {
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
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "accountLevel"
    });

    //Set data
    let doubleBatteryTotal = JSON.parse(currentPlayerData.Data.doubleBattery.Value);
    let accountExp = JSON.parse(currentPlayerData.Data.accountExp.Value);
    let accountLevel = JSON.parse(titleData.Data.accountLevel);
    let isLevelUp = 0;
    let doubleBatteryFromLevelUp = 0;

    //if OK level up and give double battery
    log.debug("required exp = " + Math.floor(30 * Math.pow(accountExp[0], 1.05)))
    if (accountExp[1] >= Math.floor(30 * Math.pow(accountExp[0], 1.05))) {
        accountExp[0] = accountExp[0] + 1
        doubleBatteryFromLevelUp = 20
        doubleBatteryTotal += doubleBatteryFromLevelUp;
        let accLevelUp = {
            PlayFabId: currentPlayerId,
            Data: {
                "accountExp": JSON.stringify(accountExp),
                "doubleBattery": JSON.stringify(doubleBatteryTotal)
            }
        }
        server.UpdateUserReadOnlyData(accLevelUp);
        isLevelUp = 1
    }
    let currentAccLevel = accountExp[0]
    let currentAccExp = accountExp[1]
    let requiredAccExp = accountLevel[currentAccLevel]
    return [isLevelUp, doubleBatteryFromLevelUp, doubleBatteryTotal, currentAccLevel, currentAccExp, requiredAccExp]
}

function Config(boombotId, boombotName, boombotCostume, weapon, weaponCostume, playerHasBoombot){
    this.boombotId = boombotId;
    this.boombotName = boombotName;
    this.boombotCostume = boombotCostume;
    this.weapon = weapon;
    this.weaponCostume = weaponCostume;
    this.playerHasBoombot = playerHasBoombot;
}

function Weapon(weaponId, weaponName, weaponLevel, weaponExp, weaponTrophy){
    this.weaponId = weaponId;
    this.weaponName = weaponName;
    this.weaponLevel = weaponLevel;
    this.weaponExp = weaponExp;
    this.weaponTrophy = weaponTrophy;
}

function getTimeInSeconds(){
    return new Date().getTime() / 1000;
}

function GetMVP(winnerPlayers) {
    let maxKDAIndex = 0;
    for(let i = 0; i < winnerPlayers.length; i++){
        if(winnerPlayers[i].KDAScore > winnerPlayers[maxKDAIndex].KDAScore){
            maxKDAIndex = i;
        }
    }
    return GetUserDisplayName(winnerPlayers[maxKDAIndex].PlayfabID);
}

function GetKDAScore(player) {
    player.deaths = player.deaths == 0 ? 0.5 : player.deaths;
    return player.kills / player.deaths;
}

function GetUserDisplayName (playfabID) {
    let result = server.GetUserAccountInfo({
        PlayFabId: playfabID
    });

    return result.UserInfo.TitleInfo.DisplayName;
}

function GrantMultipleItems(itemId, amount){
    /* args format
    {
        "itemId" : "msw_1_experience",
        "amount" : 12
    }
    */

    let itemIds = [];
    for (let i = 0; i < amount; i++){
        itemIds.push(itemId);
    }


    let itemToGrant = {
        "PlayFabId": currentPlayerId,
        "ItemIds": itemIds
    };
    server.GrantItemsToUser(itemToGrant);
}

function GrantCurrency(currency, amount){
    server.AddUserVirtualCurrency(
        {
            "PlayFabId" : currentPlayerId,
            "VirtualCurrency" : currency,
            "Amount" : amount
        }
    );
}

handlers.GiveTrophyRoadReward = function (args){
    /*
        {
            "rewardIndex" : number,
            "chosenWeaponForEXP" : number (weaponid)
        }
     */


    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });

    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["progressRewards"]
    });

    let progressRewards = JSON.parse(titleData.Data.progressRewards);

    let rewardIndex = args.rewardIndex;
    let maxTrophy = JSON.parse(currentPlayerData.Data.maxTrophy.Value);
    let lastRewardedProgressIndex = JSON.parse(currentPlayerData.Data.lastRewardedProgressIndex.Value);

    if(rewardIndex != null && rewardIndex > lastRewardedProgressIndex){
        if (progressRewards[rewardIndex].ReqTrophy <= maxTrophy){
            let currentRewards = progressRewards[rewardIndex].Rewards;

            //foreach icinde butun rewardlari vericez

            for(let i = 0; i < currentRewards.length; i++){
                GiveReward(currentRewards[i], args.chosenWeaponForEXP);
            }

            const updateUserReadOnly = {
                PlayFabId: currentPlayerId,
                Data: {
                    "lastRewardedProgressIndex": rewardIndex,
                }
            }
            server.UpdateUserReadOnlyData(updateUserReadOnly);

            return { "isRewarded": 1 }
        }
    }

    return { "isRewarded": 0 };
}

function GiveReward(currentReward, chosenWeaponForEXP){
    switch (currentReward.RewardingAction)
    {
        case "Grant":
            switch (currentReward.RewardType)
            {
                case "Item":
                    GrantMultipleItems(currentReward.Reward, currentReward.Amount);
                    break;
                case "ChoosableEXP":
                    GrantMultipleItems(chosenWeaponForEXP + "_exp", currentReward.Amount);
                    break;
                case "Currency":
                    GrantCurrency(currentReward.Reward, currentReward.Amount)
                    break;
            }
            break;
        case "Unlock":
            switch (currentReward.RewardType){
                case "Weapon":
                    UnlockWeapon(currentReward.Reward);
                    break;
                case "Gamemode":
                    break;
            }
            break;
    }
}

function UnlockWeapon(weaponId){
    let playerData = server.GetUserReadOnlyData({
        "PlayFabId" : currentPlayerId,
        "Keys" :  ["configs", "itemLevel"]
    });

    let configs = JSON.parse(playerData.Data.configs.Value);
    let itemLevel = JSON.parse(playerData.Data.itemLevel.Value);

    let boombotId = Math.floor(weaponId / 4);

    log.debug("boombotId : " + boombotId);
    log.debug("typeof boombotId : " + typeof boombotId);
    log.debug("weaponId : " + weaponId);
    log.debug("typeof weaponId : " + typeof weaponId);
    log.debug("weaponName : " + getWeapon(weaponId));

    if(configs[boombotId].playerHasBoombot === false){
        GrantMultipleItems(getBoombot(boombotId), 1);
        configs[boombotId].playerHasBoombot = true;
    }

    if(itemLevel[weaponId].weaponLevel === 0){
        GrantMultipleItems(getWeapon(weaponId), 1);
        itemLevel[weaponId].weaponLevel = 1;
    }

    let updateUserReadOnly = {
        PlayFabId : currentPlayerId,
        Data : {
            "configs" : configs,
            "itemLevel" : itemLevel
        }
    };

    server.UpdateUserReadOnlyData(updateUserReadOnly);
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
    let userData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["levelData", "weaponValues"]
    });
    log.debug("userData  =  " + userData)
    log.debug("titleData  =  " + titleData)
    let itemLevel = JSON.parse(userData.Data.itemLevel.Value);
    log.debug("itemLevel  =  " + itemLevel)
    let levelData = JSON.parse(titleData.Data.levelData)
    log.debug("levelData  =  " + levelData)
    let weaponData = titleData.Data.weaponValues;
    log.debug("weaponData  =  " + weaponData)
}

handlers.AddNewRobot = function () {
    //TODO Yeni exp sistemine göre güncellenecek
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });

    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let configs = JSON.parse(currentPlayerData.Data.configs.Value)
    let itemLevelBase = [
        1,
        0,
        0
    ]
    let configsBase = [
        1,
        1,
        1,
        0
    ]
    for (let i = 0; i < 4; i++) {
        itemLevel.push(itemLevelBase)
    }
    configs.push(configsBase)
    let updateUserReadOnly = {
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
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });

    let starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);
    let currentTutorialProgress = JSON.parse(currentPlayerData.Data.tutorialProgress.Value);
    if (currentTutorialProgress == 2 || currentTutorialProgress == 6) {
        {
            let slots = JSON.parse(currentPlayerData.Data.slots.Value);
            let whichSlot = args.slot;
            let timer = args.timer;

            slots[whichSlot].isReady = false;
            slots[whichSlot].isAvailable = false;
            slots[whichSlot].startTime = getTimeInSeconds();
            slots[whichSlot].endTime = slots[whichSlot].startTime + timer;
            /*slots[whichSlot] = [
                0,
                0,
                (getTimeInSeconds),
                (getTimeInSeconds) + timer
            ]*/
            starterBoxProgress = currentTutorialProgress == 2 ? 1 : 2;
            let updateUserReadOnly = {
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
    let lastRewardedProgressIndex = -1;
    let starterBoxProgress = 0;
    let accountExp = [1, 0];
    let doubleBattery = 0;

    let slots = [];
    for (let j = 0; j < SlotCount; j++) {
        slots.push(new Slot(false, true, 0, 0));
    }
    /*let itemLevelBase = [
        0,
        0,
        0
    ];*/
    /*let configsBase = [
        1,
        1,
        1,
        0
    ];*/


    let itemLevel = [];
    let configs = [];

    for (let k = 0; k < RobotCount; k++) {
        configs.push(new Config(k, getBoombot(k), 1, 1, 1, false));
    }

    for (let i = 0; i < WeaponCount; i++) {
        itemLevel.push(new Weapon(i, getWeapon(i), 0, 0, 0, false));
    }

    configs[0].playerHasBoombot = true;
    itemLevel[0].weaponLevel = 1;

    //log.debug("configs b = " + configs)
    //itemLevel[0][0] = 1;
    //configs[0][3] = 1;
    log.debug("configs a = " + configs);
    log.debug("itemlevel = " + itemLevel);
   /* let equipped = [
        "MekaScorp",
        1,
        1,
        1
    ];
*/
    /*let equipped = {
        "boombot" : "MekaScorp",
        "boombotCostume" : 1,
        "weapon" : 1,
        "weaponCostume" : 1
    };*/

    let equipped = {
        "boombotId" : configs[0].boombotId,
        "weapon" : itemLevel[0].weaponId,
        "costume" : configs[0].boombotCostume,
        "weaponCostume" : configs[0].weaponCostume
    };


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

    let timer = [];
    let isAvailable = [];

    for(let i = 0; i < SlotCount; i++){
        timer.push(0);
        isAvailable.push(false);
    }

    let currentPlayerData = server.GetUserReadOnlyData({
        "PlayFabId": currentPlayerId
    });
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let currentTutorialProgress = JSON.parse(currentPlayerData.Data.tutorialProgress.Value);
    let starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);

    //check for remaining time and give key
    for (i = 0; i < SlotCount; i++) {
        let remainingTime = slots[i].endTime - getTimeInSeconds();
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
                };
                server.UpdateUserReadOnlyData(updateSlotTimer);
            }

            let grantBasicKeyAndBox = {
                "PlayFabId": currentPlayerId,
                "ItemIds": ["BasicBoxKey", BoxType]
            };
            server.GrantItemsToUser(grantBasicKeyAndBox);
            timer[i] = 0;

        } else if ((isAvailable[i] === true)) {
            timer[i] = -1;
        } else
            timer[i] = remainingTime;
    }

    return {
        "timer": timer,
        "isAvailable": isAvailable,
        "isTutorial": isTutorial
    };
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
    let winnerPlayers = !args.winnerPlayers ? {} : args.winnerPlayers;
    let loserPlayers = !args.loserPlayers ? {} : args.loserPlayers;
    let drawPlayers = !args.drawPlayers ? {} : args.drawPlayers;

    //Win
    for (i = 0; i < winnerPlayers.length; i++) {
        winnerPlayers[i].KDAScore = GetKDAScore(winnerPlayers[i]);
    }

    let MVP = GetMVP(winnerPlayers);

    for(i = 0; i < winnerPlayers.length; i++){
        let winArgs = [winnerPlayers[i].PlayfabID, winnerPlayers, loserPlayers, MVP];
        winCondition(winArgs);
    }

    //Lose
    for (i = 0; i < loserPlayers.length; i++) {
        let loseArgs = [loserPlayers[i], winnerPlayers, loserPlayers, MVP];
        loseCondition(loseArgs)
    }

    //Draw
    for (i = 0; i < drawPlayers.length; i++) {
        let drawArgs = [drawPlayers[i], drawPlayers, MVP];
        drawCondition(drawArgs)
    }

    return {
        "result" : 1,
        "MVP" : MVP
    };
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
    let winnerPlayers = !args.winnerPlayers ? {} : args.winnerPlayers;
    let loserPlayers = !args.loserPlayers ? {} : args.loserPlayers;
    let drawPlayers = !args.drawPlayers ? {} : args.drawPlayers;

    //Win
    for (i = 0; i < winnerPlayers.length; i++) {
        let winArgs = winnerPlayers[i].PlayfabID;
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

    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let matchHistory = JSON.parse(currentPlayerData.Data.matchHistory.Value);
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let accountLevelUpCheckResult = accountLevelUpCheck();
    let availableSlotCount = 0;

    for (i = 0; i < 3; i++) {
        if (slots[i].isAvailable === true) {
            availableSlotCount += 1;
        }
    }
    return {
        "lastMatchResults": [[new Date().toISOString()], matchHistory[0], accountLevelUpCheckResult, availableSlotCount]
    };
}

handlers.SpendBoosterSlot = function (args) {
    args.Slot = !args.Slot ? {} : args.Slot;
    let whichSlot = args.Slot;
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    let isUsed = 0;
    let playerBooster = JSON.parse(currentPlayerInventory.VirtualCurrency.TB);
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let reqBooster = Math.ceil((slots[whichSlot].endTime - getTimeInSeconds()) / 60);
    if (playerBooster >= reqBooster && slots[whichSlot].isAvailable === false && reqBooster >= 1) {
        slots[whichSlot].endTime = getTimeInSeconds();
        let subBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "TB",
            Amount: reqBooster
        }
        server.SubtractUserVirtualCurrency(subBooster);
        let updateSlotTimer = {
            PlayFabId: currentPlayerId,
            Data: { "slots": JSON.stringify(slots) }
        }
        server.UpdateUserReadOnlyData(updateSlotTimer);
        isUsed = 1;
    }
    return { "isUsed": isUsed };
}

handlers.SpendRubySlot = function (args) {
    args.Slot = !args.Slot ? {} : args.Slot;
    let whichSlot = args.Slot;
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    let isUsed = 0;
    let playerRuby = JSON.parse(currentPlayerInventory.VirtualCurrency.RB);
    let slots = JSON.parse(currentPlayerData.Data.slots.Value);
    let reqRuby = Math.ceil((slots[whichSlot].endTime - getTimeInSeconds()) / 60);
    if (playerRuby >= reqRuby && slots[whichSlot].isAvailable === false && reqRuby >= 1) {
        slots[whichSlot].endTime = getTimeInSeconds();
        let subBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "RB",
            Amount: reqRuby
        };
        server.SubtractUserVirtualCurrency(subBooster);
        let updateSlotTimer = {
            PlayFabId: currentPlayerId,
            Data: { "slots": JSON.stringify(slots) }
        };
        server.UpdateUserReadOnlyData(updateSlotTimer);
        isUsed = 1;
    }
    return { "isUsed": isUsed };

}

handlers.OpenBox = function (args) {
    //{Box : boxId}
    //when box ready, click to open function
    //get player info
    let boxType = args.Box;
    let openBox = {
        PlayFabId: currentPlayerId,
        ContainerItemId: boxType
    };
    let result = server.UnlockContainerItem(openBox);
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let configs = JSON.parse(currentPlayerData.Data.configs.Value);
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let grantedItemIds = [];
    let grantedCoin = 0;
    let isWeaponGranted = 0;
    let isBoombotGranted = 0;
    for (i = 0; i < result.GrantedItems.length; i++) {
        grantedItemIds.push(0);
        grantedItemIds[i] = result.GrantedItems[i].ItemId;
        let itemClass = result.GrantedItems[i].ItemClass;
        if (itemClass == "coinPack") {
            grantedCoin = grantedItemIds[i];
            grantedCoin = grantedCoin.slice(4, 20);
        } else if (itemClass == "exp") {
            let weaponName = grantedItemIds[i].slice(0, -4);
            let weaponId = getWeapon(weaponName);
            let boombotId = Math.floor(weaponId / 4);
            let boombotName = getBoombot(boombotId);
            // player got weapon?
            if (itemLevel[weaponId].weaponLevel == 0) {
                isWeaponGranted = 1;
                let grantItemsIds = [weaponName];
                //player got boombot?
                if (configs[boombotId].playerHasBoombot === false) {
                    configs[boombotId].playerHasBoombot = true;
                    grantItemsIds.push(boombotName);
                    isBoombotGranted = 1;
                    configs[boombotId].boombotCostume = 1;
                    configs[boombotId].weapon = weaponId % 4 + 1;
                    configs[boombotId].weaponCostume = 1;
                    log.debug("weaponid " + configs[boombotId][1]);
                }
                itemLevel[weaponId].weaponLevel = 1;
                let updateUserReadOnly = {
                    PlayFabId: currentPlayerId,
                    Data: {
                        "configs": JSON.stringify(configs),
                        "itemLevel": JSON.stringify(itemLevel)
                    }
                };
                server.UpdateUserReadOnlyData(updateUserReadOnly);
                let grantItems = {
                    PlayFabId: currentPlayerId,
                    ItemIds: grantItemsIds
                };
                server.GrantItemsToUser(grantItems);

                var expAmount = 0;
                var currentExp = 0;
            } else {
                //Math.floor(Math.random() * (max - min + 1) ) + min;
                if (boxType == "StarterBox") {
                    var expAmount = Math.floor(Math.random() * (24 - 22 + 1)) + 22;
                }
                else {
                    var expAmount = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
                }
                itemLevel[weaponId].weaponExp += expAmount;
                var updateUserReadOnly = {
                    PlayFabId: currentPlayerId,
                    Data: {
                        "itemLevel": JSON.stringify(itemLevel)
                    }
                };
                server.UpdateUserReadOnlyData(updateUserReadOnly);
                var currentExp = itemLevel[weaponId].weaponExp;
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
    };
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
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
    });
    let boombotId = getBoombot(args.boombot);
    let weaponId = (4 * boombotId) + args.wpn - 1;
    //select boombot values
    let equipped = JSON.parse(currentPlayerData.Data.equipped.Value);
    let configs = JSON.parse(currentPlayerData.Data.configs.Value);
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    if (configs[boombotId].playerHasBoombot === true && itemLevel[weaponId].weaponLevel >= 1) {
        equipped.boombotId = boombotId;
        equipped.costume = args.cos;
        equipped.weapon = args.wpn;
        equipped.weaponCostume = args.wpnCos;
        configs[boombotId].boombotCostume = args.cos;
        configs[boombotId].weaponCostume = args.wpnCos;
       /* equipped = {
            "boombotId" : configs[boomBotId].boombotId,
            "weapon" : configs[boomBotId].weapons[args.wpn].weaponId,
            "costume" : configs[boomBotId].boombotCostume,
            "weaponCostume" : configs[boomBotId].weapons[args.wpn].weaponCostume
        };*/
            //configs[boomBotId];
    }
    let updateEquippedItems = {
        PlayFabId: currentPlayerId,
        Data: {
            "equipped": JSON.stringify(equipped),
            "configs": JSON.stringify(configs)
        }
    }

    server.UpdateUserReadOnlyData(updateEquippedItems);
}

handlers.GetUserGameParams = function () {
    let userData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["levelData", "weaponValues"]
    });
    let weaponData = JSON.parse(titleData.Data.weaponValues);
    let itemLevel = JSON.parse(userData.Data.itemLevel.Value);
    let levelData = JSON.parse(titleData.Data.levelData);
    let HP = [];
    let DMG = [];
    let nextLevel = [];
    let nextExp = levelData.levelRamp;
    let nextCoin = levelData.levelCoin;
    for (i = 0; i < WeaponCount; i++) {
        nextLevel.push([]);
        DMG.push([]);
        //HP[i] = weaponData[i][7] + (weaponData[i][7] * (itemLevel[i].weaponLevel - 1) * 0.05);
        HP[i] = weaponData[getWeapon(i)].hitPoints + (weaponData[getWeapon(i)].hitPoints * (itemLevel[i].weaponLevel - 1) * 0.05);
        nextLevel[i][0] = nextExp[itemLevel[i].weaponLevel];
        nextLevel[i][1] = nextCoin[itemLevel[i].weaponLevel];
        DMG[i] = Math.round(weaponData[getWeapon(i)].damage + (weaponData[getWeapon(i)].damage * (itemLevel[i].weaponLevel - 1) * 0.05));
    }
    let equipped = JSON.parse(userData.Data.equipped.Value);
    let configs = JSON.parse(userData.Data.configs.Value);

    //////////////////////TODO: Temporary workaround start

    let newEquipped = [];
    newEquipped.push(getBoombot(equipped.boombotId));
    newEquipped.push(equipped.weapon);
    newEquipped.push(equipped.costume);
    newEquipped.push(equipped.weaponCostume);

    let newConfigs = [];
    let newConfig = [];
    for(let i = 0; i < 4; i++){
        newConfig.push(configs[i].boombotCostume);
        newConfig.push(configs[i].weapon);
        newConfig.push(configs[i].weaponCostume);
        newConfigs.push(newConfig);
    }

    return {
        "configs": newConfigs,
        "equipped": newEquipped,
        //////////////////////TODO: Temporary workaround end
        "itemLevel": itemLevel,
        "HealthPoints": HP,
        "Damage": DMG,
        "nextLevel": nextLevel
    };
}

handlers.UpgradeWeapon = function (args) {
    //usable when an boombot can be upgraded
    args.whichWeapon = !args.whichWeapon ? {} : args.whichWeapon;
    let whichWeapon = args.whichWeapon;
    //get user item info and VC
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let currentPlayerInventory = server.GetUserInventory({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": "levelData"
    });

    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let playerCoin = JSON.parse(currentPlayerInventory.VirtualCurrency.CN);
    let levelData = JSON.parse(titleData.Data.levelData);
    let levelRamp = levelData.levelRamp;
    let levelCoin = levelData.levelCoin;
    let currentExp = itemLevel[whichWeapon].weaponExp;
    let requiredExp = levelRamp[itemLevel[whichWeapon].weaponLevel - 1];
    let requiredCoin = levelCoin[itemLevel[whichWeapon].weaponLevel - 1];
    let isUpgraded = 0;

    //if OK level up
    if (itemLevel[whichWeapon].weaponLevel < WeaponMaxLevel) {
        if ((playerCoin >= requiredCoin) && (currentExp >= requiredExp)) {
            itemLevel[whichWeapon].weaponExp -= requiredExp;
            itemLevel[whichWeapon].weaponLevel += 1;
            currentExp = itemLevel[whichWeapon].weaponExp;
            let upgradeItem = {
                PlayFabId: currentPlayerId,
                Data: { "itemLevel": JSON.stringify(itemLevel) }
            };
            server.UpdateUserReadOnlyData(upgradeItem);
            let subCoin = {
                PlayFabId: currentPlayerId,
                VirtualCurrency: "CN",
                Amount: requiredCoin
            };
            server.SubtractUserVirtualCurrency(subCoin);
            isUpgraded = 1;
        }

    }
    return {
        "isUpgraded": isUpgraded,
        "currentExp": currentExp
    };
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

    let ongoingMatch = [0, 0, 0, 0, 0]


    ongoingMatch[0] = args.PlayerGameliftId
    ongoingMatch[1] = args.MatchId
    ongoingMatch[2] = args.MatchType
    ongoingMatch[3] = args.Adress
    ongoingMatch[4] = getTimeInSeconds();
    let UpdateUserReadOnlyData = {
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
        "PlayerGameliftId": ongoingMatch[0],
        "Adress": ongoingMatch[3]
    };
    /*   var matchDuration = getMatchDuration(ongoingMatch[2])
       var matchEndTime = ongoingMatch[4] + matchDuration
       if (matchEndTime > ((getTimeInSeconds) + 15)) {
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

    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let itemLevel = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let equipped = JSON.parse(currentPlayerData.Data.equipped.Value);

    return {
        "boombot": equipped.boombotId,
        "boombotCostume": equipped.costume,
        "weapon": equipped.weapon,
        "weaponCostume": equipped.weaponCostume,
        "itemLevel": itemLevel[(4 * equipped.boombotId) + equipped.weapon - 1].weaponLevel
    };
}

handlers.FinishTutorial = function (args) {
    let currentTutorialProgress = args.Value;
    let currentPlayerData = server.GetUserReadOnlyData({ PlayFabId: currentPlayerId });
    let starterBoxProgress = JSON.parse(currentPlayerData.Data.starterBoxProgress.Value);
    /*var UpdateUserReadOnlyData =
    {
        PlayFabId: currentPlayerId,
        Data: {
            "tutorialProgress": JSON.stringify(currentTutorialProgress)
        }
    }
    server.UpdateUserReadOnlyData(UpdateUserReadOnlyData);
    */
    let slots;
    if (currentTutorialProgress == 5 && starterBoxProgress == 0) {
        slots = JSON.parse(currentPlayerData.Data.slots.Value);

        slots[0].isReady = false;
        slots[0].isAvailable = false;
        slots[0].startTime = getTimeInSeconds();
        slots[0].endTime = slots[0].startTime + BasicBoxTime;

        starterBoxProgress = 1;
    }
    if (currentTutorialProgress == 5 && starterBoxProgress == 1) {
        //todo add player data check if it was given before to ensure only once adding of batteries
        let addBooster = {
            PlayFabId: currentPlayerId,
            VirtualCurrency: "TB",
            Amount: 60
        };
        server.AddUserVirtualCurrency(addBooster);
        starterBoxProgress = 2;
    }
    let updateUserReadOnly = {
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
    let currentPlayerData = server.GetUserReadOnlyData({ PlayFabId: currentPlayerId });
    return currentPlayerData.Data.tutorialProgress;
}

handlers.GetWeaponsData = function () {
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId
    });
    let titleData = server.GetTitleData({
        PlayFabId: currentPlayerId,
        "Keys": ["levelData", "weaponValues"]
    });

    let itemLevels = JSON.parse(currentPlayerData.Data.itemLevel.Value);
    let levelData = JSON.parse(titleData.Data.levelData);
    let weaponValues = JSON.parse(titleData.Data.weaponValues);
    let levelRamps = levelData.levelRamp;
    let levelCoins = levelData.levelCoin;

    let requiredEXPToUpgrade = [];
    let requiredCoinToUpgrade = [];
    let currentEXPs = [];
    let currentLevels = [];
    let currentTrophies = [];
    let canUpgrade = [];

    let damages = [];
    let alternativeDamages = [];
    let ultiDamages = [];
    let hitPoints = [];


    //for every weapon
    for(let i = 0; i < WeaponCount; i++)
    {
        //if the weapon level is max.
        if(itemLevels[i].weaponLevel >= WeaponMaxLevel)
        {
            canUpgrade.push(false);
            currentLevels.push(WeaponMaxLevel);
            currentEXPs.push(-1);
            requiredEXPToUpgrade.push(-1);
            requiredCoinToUpgrade.push(-1);
        }
        //if weapon level is not max.
        else
        {
            currentLevels.push(itemLevels[i].weaponLevel);
            currentEXPs.push(itemLevels[i].weaponExp);

            //if we have the weapon, a.k.a. it's level is not 0
            if(itemLevels[i].weaponLevel !== 0)
            {
                requiredEXPToUpgrade.push(parseInt(levelRamps[itemLevels[i].weaponLevel - 1]));
                requiredCoinToUpgrade.push(parseInt(levelCoins[itemLevels[i].weaponLevel - 1]));
                canUpgrade.push(requiredEXPToUpgrade[i] <= currentEXPs[i]);
            }
            //if we don't have the weapon.
            else
            {
                requiredEXPToUpgrade.push(0);
                requiredCoinToUpgrade.push(0);
                canUpgrade.push(false);
            }
        }
        currentTrophies.push(itemLevels[i].weaponTrophy ? itemLevels[i].weaponTrophy : 0);


        let damage = CalculateWeaponValueAndNextLevelIncrement(weaponValues[getWeapon(i)].damage, itemLevels[i].weaponLevel, WeaponLevelUpValueModifier);
        let alternativeDamage = CalculateWeaponValueAndNextLevelIncrement(weaponValues[getWeapon(i)].alternativeDamage, itemLevels[i].weaponLevel, WeaponLevelUpValueModifier);
        let tempUltiBaseValue = weaponValues[getWeapon(i)].ultiDamageScale * weaponValues[getWeapon(i)].damage;
        let ultiDamage = CalculateWeaponValueAndNextLevelIncrement(tempUltiBaseValue, itemLevels[i].weaponLevel, WeaponLevelUpValueModifier);
        let hitPoint = CalculateWeaponValueAndNextLevelIncrement(weaponValues[getWeapon(i)].hitPoints, itemLevels[i].weaponLevel, WeaponLevelUpValueModifier);


        damages.push(damage);
        alternativeDamages.push(alternativeDamage);
        ultiDamages.push(ultiDamage);
        hitPoints.push(hitPoint);
    }


    return {
        "canUpgrade": canUpgrade,
        "currentLevel" : currentLevels,
        "currentExp": currentEXPs,
        "currentTrophy" : currentTrophies,
        "requiredExp": requiredEXPToUpgrade,
        "requiredCoin": requiredCoinToUpgrade,

        "primaryDamages" : damages,
        "secondaryDamages" : alternativeDamages,
        "ultimateDamages" : ultiDamages,
        "healths" : hitPoints
    }
}

handlers.GetWeaponAndTrophyCount = function (){
    let currentPlayerData = server.GetUserReadOnlyData({
        PlayFabId: currentPlayerId,
        "Keys": ["itemLevel"]
    });

    let currentPlayerTrophy = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId,
        "StatisticNames": "Trophy"
    });

    let itemLevels = JSON.parse(currentPlayerData.Data.itemLevel.Value);

    let unlockedWeaponCount = 0;

    for (let i = 0; i < WeaponCount; i++)
    {
        if(parseInt(itemLevels[i].weaponLevel) > 0){
            unlockedWeaponCount++;
        }
    }

    return {
        "trophyCount" : JSON.parse(currentPlayerTrophy.Statistics[0].Value),
        "totalWeaponCount" : WeaponCount,
        "unlockedWeaponCount" : unlockedWeaponCount
    };
}

//Calculates the weapon value using base value(level 1 value), current level of the weapon, and the increment modifier (see the beginning of file for value named WeaponLevelUpValueModifier);
function CalculateWeaponValueAndNextLevelIncrement(baseValue, level, modifier){
    return {
        "value" : Math.round(baseValue + (baseValue * (level - 1) * modifier)),
        "nextLevelIncrement" : Math.round(baseValue + (baseValue * (level) * modifier)) - Math.round(baseValue + (baseValue * (level - 1) * modifier))
    }
}
const cwd = "http://127.0.0.1:3000"

let LSallFoldersSongs; //localStorage
let fileLocationAnchorTags; //to not call fetch again
let globalSongs = [];

let currentSong = new Audio();
let currentFolder;
let LScurrentQueue; // localStorage
let LScurrentShuffleQueue; // localStorage
let LSfolderRelativePath;
let LSlastPlayedSong;
let LSlastPlayedSongTime;
let squaresQueue = []

let LSshuffle; // boolean localStorage
let LSrepeat; // localStorage 

let currentlyOpenedPlaylist = "";

let ultraContainer1 = document.querySelector("#ultraContainer1")
let ultraContainer2 = document.querySelector("#ultraContainer2")
showUltraContainer1()

let higherMainContainer1 = document.querySelector("#higherMainContainer1")
let higherMainContainer2 = document.querySelector("#higherMainContainer2")
let higherMainContainer3 = document.querySelector("#higherMainContainer3")
showContainer1()

function display(element) {
    element.style.display = "block"
}
function hide(element) {
    element.style.display = "none"
}

function showContainer1() {
    display(higherMainContainer1)
    hide(higherMainContainer2)
    hide(higherMainContainer3)

    currentlyOpenedPlaylist = ""
    document.querySelector(".queueImg").src = "icons/queue.svg"
}
function showContainer2() {
    hide(higherMainContainer1)
    display(higherMainContainer2)
    hide(higherMainContainer3)

    document.querySelector(".queueImg").src = "icons/queue.svg"
}
function showContainer3() {
    hide(higherMainContainer1)
    hide(higherMainContainer2)
    display(higherMainContainer3)

    currentlyOpenedPlaylist = ""
    document.querySelector(".queueImg").src = "icons/queueGreen.svg"
}
// onclick
let lastOpenedContainer;
function toggleContainer3() {
    if (higherMainContainer1.style.display == "block") { lastOpenedContainer = 1 }
    else if (higherMainContainer2.style.display == "block") { lastOpenedContainer = 2 }


    if (higherMainContainer3.style.display == "none") {
        showContainer3()
    }
    else {
        if (lastOpenedContainer == 1) { showContainer1() }
        else if (lastOpenedContainer == 2) { showContainer2() }
    }
}

function showUltraContainer1() {
    display(ultraContainer1)
    hide(ultraContainer2)
}
function showUltraContainer2() {
    hide(ultraContainer1)
    display(ultraContainer2)

    currentlyOpenedPlaylist = ""
}
// onclick
function toggleUltraContainer2() {
    if (ultraContainer1.style.display == "block") {
        showUltraContainer2();
        if (window.innerWidth > 830 && ultraContainer2.requestFullscreen) {
            ultraContainer2.requestFullscreen();
        }

    } else if (ultraContainer2.style.display == "block") {
        showUltraContainer1();
        if (window.innerWidth > 830 && document.exitFullscreen) {
            document.exitFullscreen();
        }

    }
}



function generateRandomColor() {
    let letters = "0123456789abcdef"
    let color = "#"
    for (let i = 0; i < 6; i++) {
        let randomIndex = Math.floor(Math.random() * 16)
        color += letters[randomIndex]
    }
    return color
}

function absoluteToRelative(path) {
    const urlObject = new URL(path);
    const relativePath = decodeURIComponent(urlObject.pathname);
    return relativePath.slice(1);
}

function relativePathToFolderName(path) {
    return path.split('/').filter(Boolean).pop();
}

const duractionOfAParticularSong = async (url) => {
    return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration);
        });
        audio.load();
    });
};

async function getTotalDuration(list) {
    let totalDuration = 0;

    for (const url of list) {
        const duration = await duractionOfAParticularSong(url);
        totalDuration += duration;
    }
    totalDuration = Math.floor(totalDuration);

    if (totalDuration >= 3600) {
        const hrs = Math.floor(totalDuration / 3600);
        const mins = Math.floor((totalDuration % 3600) / 60);
        const singularOrPlural1 = hrs === 1 ? "hr" : "hrs";
        const singularOrPlural2 = mins === 1 ? "min" : "mins";

        return `${hrs} ${singularOrPlural1} ${twoDigitNumber(mins)} ${singularOrPlural2}`;
    } else if (totalDuration < 3600) {
        const mins = Math.floor(totalDuration / 60);
        const singularOrPlural1 = mins === 1 ? "min" : "mins";

        return `${twoDigitNumber(mins)} ${singularOrPlural1}`;
    }
}

function twoDigitNumber(num) {
    return num < 10 ? "0" + num : num.toString();
}


function hhmmFormat(duration) {
    let sec = twoDigitNumber(duration % 60)
    let min = Math.floor(duration / 60)
    return `${min}:${sec}`
}

async function hhmm(songRelativePath) {
    let duration = Math.floor(await duractionOfAParticularSong(songRelativePath))
    return hhmmFormat(duration)
}

async function songInLikedOrNot(songRelativePath) {
    let LSallFoldersSongs = JSON.parse(localStorage.getItem("LSallFoldersSongs"))
    for (const iterator of LSallFoldersSongs['Liked']) {
        if (relativePathToFolderName(songRelativePath) == relativePathToFolderName(iterator)) {
            return true
        }
    }
    return false
}

async function getMetaTags(path) {
    function getPromiseMetaTags(path) {
        return new Promise((resolve, reject) => {
            jsmediatags.read(path, {
                onSuccess: tag => {
                    resolve(tag.tags);
                },
                onError: error => {
                    reject(error);
                }
            });
        });
    }
    function extractFilenameFromURL(url) {
        const urlObject = new URL(url);
        const filename = urlObject.pathname.split('/').pop();
        return filename;
    }

    try {
        const tag = await getPromiseMetaTags(path);

        return {
            title: tag.title || extractFilenameFromURL(path),
            artist: tag.artist || 'Unknown Artist',
            cover: tag.comment ? `songs_covers/${tag.comment.text}` : 'songs_covers/cover0.jpeg'
        };
    } catch (error) {
        return {
            title: extractFilenameFromURL(path),
            artist: 'Unknown Artist',
            cover: 'songs_covers/cover0.jpeg'
        };
    }
}

async function getAndSetRandomSquares() {
    function generateRandomUniqueIntegers(numElements, leastNumber, maxNumber) {
        const uniqueIntegers = new Set();

        while (uniqueIntegers.size < numElements) {
            const randomInteger = Math.floor(Math.random() * (maxNumber - leastNumber + 1)) + leastNumber;
            uniqueIntegers.add(randomInteger);
        }

        return Array.from(uniqueIntegers);
    }
    async function createSquare(path) {
        let metaTags = await getMetaTags(path)
        let cover = metaTags.cover
        const square = document.createElement("div")
        square.innerHTML = `
        <img class="square-child-img" src="${cover}" alt="" onclick="playMusic('${absoluteToRelative(path)}', null, {title: '${metaTags.title}', artist: '${metaTags.artist}', cover: '${cover}' })">
        `
        square.className = "square"
        document.getElementById("lowerMainContainer1").appendChild(square)

        do {
            setPosition(square)
        } while (checkCollisions(square))
        // animateSquare(square)

    }

    function checkCollisions(element) {
        const squares = document.getElementsByClassName('square');
        const currentLeft = parseFloat(element.style.left);
        const currentTop = parseFloat(element.style.top);

        for (const rect of squares) {
            if (rect !== element) {
                const rectLeft = parseFloat(rect.style.left);
                const rectTop = parseFloat(rect.style.top);

                if (
                    currentLeft < rectLeft + rect.offsetWidth &&
                    currentLeft + element.offsetWidth > rectLeft &&
                    currentTop < rectTop + rect.offsetHeight &&
                    currentTop + element.offsetHeight > rectTop
                ) {
                    return true; // Collision detected
                }
            }
        }
        return false; // No collisions
    }

    function setPosition(element) {
        const containerWidth = document.getElementById("lowerMainContainer1").offsetWidth;
        const containerHeight = document.getElementById("lowerMainContainer1").offsetHeight;

        const maxX = containerWidth - element.offsetHeight;
        const maxY = containerHeight - element.offsetHeight;

        const randomX = Math.floor(Math.random() * maxX)
        const randomY = Math.floor(Math.random() * maxY)

        element.style.left = `${randomX}px`
        element.style.top = `${randomY}px`
    }

    function animateSquare(element) {
        const speed = 7;
        let deltaX = (Math.random() - 0.5) * speed;
        let deltaY = (Math.random() - 0.5) * speed;

        function move() {
            const currentLeft = parseFloat(element.style.left)
            const currentTop = parseFloat(element.style.top)

            const squares = document.getElementsByClassName('square')
            for (const rect of squares) {
                if (rect !== element) {
                    const rectLeft = parseFloat(rect.style.left)
                    const rectTop = parseFloat(rect.style.top)

                    if (
                        currentLeft < rectLeft + rect.offsetHeight &&
                        currentLeft + element.offsetWidth > rectLeft &&
                        currentTop < rectTop + rect.offsetHeight &&
                        currentTop + element.offsetHeight > rectTop
                    ) {
                        deltaX = -deltaX
                        deltaY = -deltaY
                        break
                    }
                }
            }

            // checking for collisions with container boundaries
            if (currentLeft + element.offsetWidth + deltaX > lowerMainContainer1.offsetWidth || currentLeft + deltaX < 0) {
                deltaX = -deltaX
            }

            if (currentTop + element.offsetHeight + deltaY > lowerMainContainer1.offsetHeight || currentTop + deltaY < 0) {
                deltaY = -deltaY
            }

            element.style.left = `${currentLeft + deltaX}px`
            element.style.top = `${currentTop + deltaY}px`

            requestAnimationFrame(move)
        }

        move()
    }

    const numberOfSquares = 10;
    let temp = generateRandomUniqueIntegers(numberOfSquares, 0, globalSongs.length - 1)
    for (let i = 0; i < temp.length; i++) {
        createSquare(globalSongs[temp[i]]);
        squaresQueue.push(absoluteToRelative(globalSongs[temp[i]]))
    }
    LScurrentQueue = squaresQueue
}


let tempPreviouslySavedVolume = document.querySelector(".range2").value;
function setUpKeyboardShortcuts() {
    async function displayVolumePercentage(showingVolumePercentage, volumeImg, number) {
        clearTimeout()
        showingVolumePercentage.style.display = "block"
        volumeImg.style.display = "none"
        showingVolumePercentage.innerText = number
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 300);
        });
    }

    document.addEventListener('keydown', async (event) => {
        // PAUSE/PLAY
        if (event.code === 'Space' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
            event.preventDefault()
            playPause()
        }

        // NEXT SONG
        if ((event.ctrlKey || event.metaKey) && event.code === 'ArrowRight') {
            event.preventDefault()
            nextSong()
        }

        // PREVIOUS SONG
        if ((event.ctrlKey || event.metaKey) && event.code === 'ArrowLeft') {
            event.preventDefault()
            previousSong()
        }

        // VOLUME UP
        let volumeRange = document.querySelector(".range2");
        let showingVolumePercentage = document.querySelector("#volumePercentage")
        let volumeImg = document.querySelector(".rightPlaybar1 span img")
        if ((event.ctrlKey || event.metaKey) && event.code === 'ArrowUp') {
            event.preventDefault();

            if ((currentSong.volume + 0.1) > 1) {
                currentSong.volume = 1
            } else {
                currentSong.volume += 0.1
            }
            volumeRange.value = (currentSong.volume) * 100
            await displayVolumePercentage(showingVolumePercentage, volumeImg, volumeRange.value)
            showingVolumePercentage.style.display = "none"
            volumeImg.style.display = "block"
        }

        // VOLUME DOWN
        if ((event.ctrlKey || event.metaKey) && event.code === 'ArrowDown') {
            event.preventDefault();

            if ((currentSong.volume - 0.1) < 0) {
                currentSong.volume = 0
            } else {
                currentSong.volume -= 0.1
            }
            volumeRange.value = (currentSong.volume) * 100
            await displayVolumePercentage(showingVolumePercentage, volumeImg, volumeRange.value)
            showingVolumePercentage.style.display = "none"
            volumeImg.style.display = "block"
        }

        // FORWARDS
        if (event.code == "ArrowRight" && !(event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            currentSong.currentTime += 10
        }

        // BACKWARDS
        if (event.code == "ArrowLeft" && !(event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            currentSong.currentTime -= 10
        }

        // SHUFFLE
        if (event.code == "KeyS" && !(event.ctrlKey || event.metaKey)) {
            handlingShuffle()
        }

        // REPEAT
        if (event.code == "KeyR" && !(event.ctrlKey || event.metaKey)) {
            handlingRepeat()
        }

        // QUEUE
        if (event.code == "KeyQ" && !(event.ctrlKey || event.metaKey)) {
            toggleContainer3()
        }

        // MUTE
        if (event.code == "KeyM" && !(event.ctrlKey || event.metaKey)) {
            if (currentSong.volume > 0) {
                tempPreviouslySavedVolume = volumeRange.value
                volumeImg.src = "icons/volumeMute.svg"
                currentSong.volume = 0
                volumeRange.value = 0
            } else if (currentSong.volume == 0) {
                volumeImg.src = "icons/volume.svg"
                currentSong.volume = (tempPreviouslySavedVolume) / 100
                volumeRange.value = tempPreviouslySavedVolume
            }
        }

        // FULL SCREEN
        if (event.code == "KeyF") {
            toggleUltraContainer2()
        }
    });

    navigator.mediaSession.setActionHandler('play', () => {
        playPause()
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        playPause()
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousSong()
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextSong()
    });
}

function settingUpVolumeAndOthers() {
    if (window.innerWidth > 330) {
        let showingVolumePercentage = document.querySelector("#volumePercentage")
        let volumeImg = document.querySelector(".rightPlaybar1 span img")
        let range = document.querySelector(".range2")

        range.addEventListener("input", () => {
            let temp = range.value
            currentSong.volume = temp / 100
            showingVolumePercentage.style.display = "block"
            volumeImg.style.display = "none"
            showingVolumePercentage.innerText = temp
            if (temp == 0) {
                volumeImg.src = "icons/volumeMute.svg"
            } else {
                volumeImg.src = "icons/volume.svg"
            }
        })
        range.addEventListener("change", () => {
            currentSong.volume = (range.value) / 100
            showingVolumePercentage.style.display = "none"
            volumeImg.style.display = "block"
        })
        let tempPreviouslySavedVolume;
        volumeImg.addEventListener("click", () => {
            if (currentSong.volume > 0) {
                tempPreviouslySavedVolume = range.value
                volumeImg.src = "icons/volumeMute.svg"
                currentSong.volume = 0
                range.value = 0
            } else if (currentSong.volume == 0) {
                volumeImg.src = "icons/volume.svg"
                currentSong.volume = (tempPreviouslySavedVolume) / 100
                range.value = tempPreviouslySavedVolume
            }
        })
    }
    else if (window.innerWidth <= 830) {
        currentSong.volume = 1
    }
}

function setOnClickListenersOnControls() {
    for (const iterator of document.querySelectorAll(".shuffle")) {
        iterator.addEventListener("click", () => handlingShuffle())
    }
    for (const iterator of document.querySelectorAll(".playOrPause")) {
        iterator.addEventListener("click", () => playPause())
    }
    for (const iterator of document.querySelectorAll(".repeat")) {
        iterator.addEventListener("click", () => handlingRepeat())
    }
    for (const iterator of document.querySelectorAll(".previous")) {
        iterator.addEventListener("click", () => previousSong())
        iterator.addEventListener("dblclick", () => {
            currentSong.currentTime = 0
        })
    }
    for (const iterator of document.querySelectorAll(".next")) {
        iterator.addEventListener("click", () => nextSong())
        iterator.addEventListener("dblclick", () => {
            if (LSrepeat == 2) {
                handlingRepeat()
                nextSong()
                nextSong()
            }
        })
    }
}

function setScrollingEffects() {
    function setScrollingEffect(number) {
        function scrollingEffect(container, text, number) {
            const containerWidth = container.clientWidth;
            const textWidth = text.clientWidth;

            if (textWidth > containerWidth) {
                const animationDuration = (textWidth / containerWidth) * 10;
                text.style.animation = `scrollText${number} ${animationDuration}s ease-in-out infinite`;
            } else {
                text.style.animation = ''
            }
        }

        let containers = document.querySelectorAll(`.scrolling-container${number}`)
        let texts = document.querySelectorAll(`.scrolling-text${number}`)
        for (let i = 0; i < containers.length; i++) {
            scrollingEffect(containers[i], texts[i], number)
        }
    }

    setScrollingEffect(1)
    setScrollingEffect(2)
    setScrollingEffect(3)
}

function togglingSideBar(leftSvg) {
    leftSvg.classList.toggle("leftSvgRotate")
    document.querySelector("#sidebar").classList.toggle("min-content-width")
    for (const iterator of document.querySelectorAll(".toHide")) {
        iterator.classList.toggle("display-none")
    }
    document.querySelector(".upperSectionOfLowerSidebar").classList.toggle("justify-content-center")
    for (const iterator of document.querySelectorAll("#sidebar #upperSidebar ul li")) {
        iterator.classList.toggle("justify-content-center")
    }
}

function setOnClickListenerOnLeftSvg() {
    leftSvg = document.querySelector("#leftSvg")
    leftSvg.addEventListener("click", () => togglingSideBar(leftSvg))
}

function jsMediaQueryType() {
    windowWidth = window.innerWidth
    if (windowWidth < 1200) {
        togglingSideBar(document.querySelector("#leftSvg"))
    }
}

async function getAndPopulateFolders() {
    let ulHtml = document.querySelector(".playlistsContainerUl")
    ulHtml.innerHTML = " "

    let miniCardsContainer = document.querySelector(".upperMainContainer1")
    miniCardsContainer.innerHTML = " "

    let dialogBoxPlaylists = document.querySelector("#dialogBox .lowerDialogBox")
    dialogBoxPlaylists.innerHTML = " "

    let temp = await fetch(`${cwd}/songs`)
    let response = await temp.text()
    let tempDiv = document.createElement("div")
    tempDiv.innerHTML = response

    let as = tempDiv.getElementsByTagName("a")

    let counter = 1
    for (let index = 0; index < as.length; index++) {
        const element = as[index];

        if (element.href.endsWith("Liked/")) {
            let temp = await fetch(`${element.href}info.json`)
            let tempResponse = await temp.json()
            let singularOrPlural = "songs"
            let numberOfLikedSongs;
            try {
                numberOfLikedSongs = JSON.parse(localStorage.getItem('LSallFoldersSongs'))['Liked'].length
            } catch (error) {
                numberOfLikedSongs = tempResponse.songs.length
            }
            if (numberOfLikedSongs == 1) {
                singularOrPlural = "song"
            }
            ulHtml.innerHTML += `
            <li onclick="getSongsForAPlaylist('${element.href}')">
                        <img class="playlistImgLibrary" src="${tempResponse.path}" alt="Liked">
                        <div class="rightOfPlaylistCover toHide">
                            <div class="playlistName">${tempResponse.title}</div>
                            <div class="playlistOwner convertWhiteTextToLightGrey">${tempResponse.type} <img src="icons/star.svg" alt=""> <span id="numberOfLikedSongException"> ${numberOfLikedSongs} ${singularOrPlural}</span></div>
                        </div>
                    </li>
            `
            miniCardsContainer.innerHTML += `
            <div class="miniCard" onclick="getSongsForAPlaylist('${element.href}')">
                <img class="playlistImgMiniCard" src="${tempResponse.path}" alt="Liked">
                <div>${tempResponse.title}</div>
            </div>
            `
        }
    }
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.innerHTML.startsWith(".") == false) {
            let temp = await fetch(`${element.href}info.json`)
            let tempResponse = await temp.json()
            if (tempResponse.title != "Liked Songs") {
                ulHtml.innerHTML += `
                    <li onclick="getSongsForAPlaylist('${element.href}')">
                        <img class="playlistImgLibrary" src="${tempResponse.path}" alt="">
                        <div class="rightOfPlaylistCover toHide">
                            <div class="playlistName">${tempResponse.title}</div>
                            <div class="playlistOwner convertWhiteTextToLightGrey">${tempResponse.type} <img src="icons/star.svg" alt=""> ${tempResponse.owner}</div>
                        </div>
                    </li>
                `
                if (counter <= 5) {
                    miniCardsContainer.innerHTML += `
                        <div class="miniCard" onclick="getSongsForAPlaylist('${element.href}')">
                        <img class="playlistImgMiniCard" src="${tempResponse.path}" alt="Liked">
                        <div>${tempResponse.title}</div>
                        </div>
                    `
                    counter++
                }
                if (tempResponse.title != "All Songs") {
                    dialogBoxPlaylists.innerHTML += `
                    <li class="cp" onclick="processInput('${relativePathToFolderName(absoluteToRelative(element.href))}')">
                        <img src="${tempResponse.path}">
                        <span>${tempResponse.title}</span>
                    </li>
                    `
                }

            }
        }
    }



    fileLocationAnchorTags = as
}

// onclick
async function getSongsForAPlaylist(folderPath) {
    currentlyOpenedPlaylist = absoluteToRelative(folderPath)
    showContainer2()
    let folderName = absoluteToRelative(folderPath)
    let LSallFoldersSongs = JSON.parse(localStorage.getItem("LSallFoldersSongs"))
    let songsPathArray = LSallFoldersSongs[relativePathToFolderName(folderName)]

    let temp = await fetch(`${folderName}info.json`)
    let tempResponse = await temp.json()

    let mainContainer2 = document.querySelector("#mainContainer2")
    let numberOfSongs = songsPathArray.length
    let singularOrPlural = "songs"
    if (numberOfSongs == 1) { singularOrPlural = "song" }
    mainContainer2.innerHTML = `
    <div class="upperMainContainer2" style="background: radial-gradient(circle at left, ${generateRandomColor()} 0%, ${generateRandomColor()} 100%); 
    background-size: 400% 400%;
    animation: animationName 10s ease infinite;">
    <img class="playListImgUpperMainContainer2" src="${tempResponse.path}" alt="">
    <div class="playlistInfoUpperMainContainer2">
    <div class="convertWhiteTextToLighterGrey">${tempResponse.type}</div>
    <div>${tempResponse.title}</div>
                        <div class="convertWhiteTextToLighterGrey">${tempResponse.description}</div>
                        <div>${tempResponse.owner} • ${numberOfSongs} ${singularOrPlural}, <span class="convertWhiteTextToLighterGrey">about ${await getTotalDuration(songsPathArray)}</span> </div>
                    </div>
    
                </div>
    `
    await refreshSongsInAPlayist(folderName, songsPathArray);
}

async function refreshSongsInAPlayist(folderName, songsPathArray) {
    songList = document.querySelector(".songList");
    songList.innerHTML = "";
    let counter = 1;
    let removeFromPlaylist = '';
    for (const songRelativePath of songsPathArray) {
        let metaTags = await getMetaTags(`${cwd}/${songRelativePath}`);
        let likePath = "icons/like.svg";
        let visibility = "hidden";
        if (await songInLikedOrNot(songRelativePath) == true) {
            likePath = "icons/likeFill.svg";
            visibility = "visible";
        }
        if ((folderName != "songs/global/") && (folderName != "songs/Liked/")) {
            removeFromPlaylist = `<img class="iconsRightSideSong somethingImg0 controlsScale" src="icons/deleteFromPlaylist.svg" alt="Delete from playlist" style="visibility: hidden;" onclick="removeSongFromAPlaylist('${songRelativePath}', '${relativePathToFolderName(folderName)}')">`
        }
        songList.innerHTML += `
        <li class="song" ondblclick="playMusic('${songRelativePath}', '${folderName}', {title: '${metaTags.title}', artist: '${metaTags.artist}', cover: '${metaTags.cover}'})">
        <div class="leftSide">
        <div class="number-image convertWhiteTextToLightGrey">
        <div class="number">${counter}</div>
        <img style="display: none;" class="playButtonInsideNumberImage" src="icons/playPlaylistWhite.svg" alt="" onclick="playMusic('${songRelativePath}', '${folderName}', {title: '${metaTags.title}', artist: '${metaTags.artist}', cover: '${metaTags.cover}'})">
        </div>
        <img class="songCoverImgSong" src="${metaTags.cover}" alt="cover">
        <div class="songAndArtist">
        <div class="songName">${metaTags.title}</div>
        <div class="artistName convertWhiteTextToLightGrey">${metaTags.artist}</div>
        </div>
        </div>
        <div class="rightSide">
        ${removeFromPlaylist}
        <img class="iconsRightSideSong somethingImg1 controlsScale" src="icons/plus.svg" alt="Plus" style="visibility: hidden;" onclick="openDialog('${songRelativePath}')">
        <img class="iconsRightSideSong somethingImg2 controlsScale" src="icons/add to queue.svg" alt="add to queue" style="visibility: hidden;" onclick="addSongToQueue('${songRelativePath}')">
        <img class="iconsRightSideSong somethingImg3 controlsScale" onclick="addRemoveSongToLikedSongThroughImg(this, '${songRelativePath}')" src=${likePath} alt="Like" style="visibility: ${visibility};">
        <span class="convertWhiteTextToLightGrey">${await hhmm(songRelativePath)}</span>
        </div>
        </li>
        `;
        counter++;
    }

    Array.from(songList.querySelectorAll("li")).forEach(element => {
        element.addEventListener("mouseover", () => {
            element.querySelector(".number").style.display = "none";
            element.querySelector(".playButtonInsideNumberImage").style.display = "inline";
            if ((folderName != "songs/global/") && (folderName != "songs/Liked/")) {
                element.querySelector(".somethingImg0").style.visibility = "visible";
            }
            element.querySelector(".somethingImg1").style.visibility = "visible";
            element.querySelector(".somethingImg2").style.visibility = "visible";
            let tempElement = element.querySelector(".somethingImg3");
            if (relativePathToFolderName(tempElement.src) != "likeFill.svg") {
                tempElement.style.visibility = "visible";
            }
        });
        element.addEventListener("mouseout", () => {
            element.querySelector(".number").style.display = "block";
            element.querySelector(".playButtonInsideNumberImage").style.display = "none";
            if ((folderName != "songs/global/") && (folderName != "songs/Liked/")) {
                element.querySelector(".somethingImg0").style.visibility = "hidden";
            }
            element.querySelector(".somethingImg1").style.visibility = "hidden";
            element.querySelector(".somethingImg2").style.visibility = "hidden";
            let tempElement = element.querySelector(".somethingImg3");
            if (relativePathToFolderName(tempElement.src) != "likeFill.svg") {
                tempElement.style.visibility = "hidden";
            }
        });
    });
}

async function getGlobalSongs() {
    globalSongs = []
    let temp = await fetch(`${cwd}/songs/global`)
    let response = await temp.text()
    let tempDiv = document.createElement("div")
    tempDiv.innerHTML = response
    let as = tempDiv.getElementsByTagName("a")
    for (const iterator of as) {
        if (iterator.href.endsWith(".mp3")) {
            globalSongs.push(iterator.href)
        }
    }
}

async function setLocalStorages() {
    // LSallFoldersSongs
    // LScurrentQueue
    // LScurrentShuffleQueue
    // LSshuffle
    // LSrepeat
    // LSfolderRelativePath
    // LSlastPlayedSong
    // LSlastPlayedSongTime

    function idkWhatToCallThisFunction() {
        LSallFoldersSongs['global'] = []
        for (let index = 0; index < globalSongs.length; index++) {
            const element = globalSongs[index];

            LSallFoldersSongs['global'].push(absoluteToRelative(element));
        }
    }

    if (localStorage.getItem("LSallFoldersSongs") === null) {
        customAlert("Please Check Out JavaScript Developers Console for Keyboard Shortcuts", 5000)
        myMessage()
        async function getAllFoldersSong() {
            LSallFoldersSongs = {}
            for (const iterator of fileLocationAnchorTags) {
                if (iterator.text.startsWith(".") == false && iterator.text != "global/") {
                    let temp = await fetch(`${iterator.href}info.json`)
                    let tempResponse = await temp.json()
                    let filename = iterator.text.slice(0, -1)
                    LSallFoldersSongs[filename] = tempResponse.songs
                }
            }
            idkWhatToCallThisFunction()
        }

        await getAllFoldersSong()
        localStorage.setItem("LSallFoldersSongs", JSON.stringify(LSallFoldersSongs))
    }
    else {
        LSallFoldersSongs = JSON.parse(localStorage.getItem("LSallFoldersSongs"))
        if (LSallFoldersSongs['global'].length != globalSongs.length) {
            idkWhatToCallThisFunction()
            localStorage.setItem("LSallFoldersSongs", JSON.stringify(LSallFoldersSongs))
            console.log("Song Removed or Added from 'global'");
        }
    }

    if (localStorage.getItem("LScurrentQueue") === null) {
        localStorage.setItem("LScurrentQueue", JSON.stringify([]))
    } else {
        LScurrentQueue = JSON.parse(localStorage.getItem("LScurrentQueue"))
    }

    if (localStorage.getItem("LScurrentShuffleQueue") === null) {
        localStorage.setItem("LScurrentShuffleQueue", JSON.stringify([]))
    } else {
        LScurrentShuffleQueue = JSON.parse(localStorage.getItem("LScurrentShuffleQueue"))
    }

    if (localStorage.getItem("LSshuffle") === null) {
        localStorage.setItem("LSshuffle", JSON.stringify(false))
    } else {
        LSshuffle = JSON.parse(localStorage.getItem("LSshuffle"))
    }

    if (localStorage.getItem("LSrepeat") === null) {
        localStorage.setItem("LSrepeat", JSON.stringify(0))
    } else {
        LSrepeat = localStorage.getItem("LSrepeat")
    }

    if (localStorage.getItem("LSfolderRelativePath") === null) {
        localStorage.setItem("LSfolderRelativePath", JSON.stringify(" "))
    } else {
        LSfolderRelativePath = localStorage.getItem("LSfolderRelativePath")
    }

    if (localStorage.getItem("LSlastPlayedSong") === null) {
        localStorage.setItem("LSlastPlayedSong", JSON.stringify(" "))
    } else {
        LSlastPlayedSong = localStorage.getItem("LSlastPlayedSong")
    }

    if (localStorage.getItem("LSlastPlayedSongTime") === null) {
        localStorage.setItem("LSlastPlayedSongTime", JSON.stringify(0))
    } else {
        LSlastPlayedSongTime = JSON.parse(localStorage.getItem("LSlastPlayedSongTime"))
    }
    window.addEventListener("unload", () => {
        localStorage.setItem("LSlastPlayedSongTime", JSON.stringify(currentSong.currentTime))
    })
}

async function setPreliminaryControlsAndStuff() {
    let LSlastPlayedSong = JSON.parse(localStorage.getItem("LSlastPlayedSong"))
    if (LSlastPlayedSong.endsWith(".mp3") == true) {
        let metaTags = await getMetaTags(`${cwd}/${LSlastPlayedSong}`)
        playMusic(LSlastPlayedSong, LSfolderRelativePath, { title: `${metaTags.title}`, artist: `${metaTags.artist}`, cover: `${metaTags.cover}` }, true, LSlastPlayedSongTime)

        // For shuffle
        const shuffleButtons = document.querySelectorAll(".shuffle")
        if (LSshuffle == true) {
            for (const iterator of shuffleButtons) { iterator.src = "icons/shuffleGreen.svg" }
        } else {
            for (const iterator of shuffleButtons) { iterator.src = "icons/shuffle.svg" }
        }

        // For repeat
        const repeatButtons = document.querySelectorAll(".repeat")
        if (LSrepeat == 0) {
            for (const iterator of repeatButtons) { iterator.src = "icons/repeat.svg" }
        }
        else if (LSrepeat == 1) {
            for (const iterator of repeatButtons) { iterator.src = "icons/repeatGreen.svg" }
        }
        else if (LSrepeat == 2) {
            for (const iterator of repeatButtons) { iterator.src = "icons/repeatOneGreen.svg" }
        }
    }
    setUpKeyboardShortcuts()
    settingUpVolumeAndOthers()
    setOnClickListenersOnControls()
    setScrollingEffects()
}

async function setUpQueueHtml() {
    for (const ulQueueSongHtml of document.querySelectorAll(".ulSongQueueHtml")) {
        ulQueueSongHtml.innerHTML = " "
        let counter = 1;
        let queue;
        let tempQueue
        if (LSshuffle == true) {
            tempQueue = JSON.parse(localStorage.getItem("LScurrentShuffleQueue"))
        }
        else {
            tempQueue = JSON.parse(localStorage.getItem("LScurrentQueue"))
        }
        queue = tempQueue.slice(tempQueue.indexOf(absoluteToRelative(currentSong.src)), tempQueue.length + 1)
        for (const queueSong of queue) {
            let metaTags = await getMetaTags(`${cwd}/${queueSong}`)
            let likePath = "icons/like.svg"
            if (await songInLikedOrNot(queueSong) == true) {
                likePath = "icons/likeFill.svg"
            }

            ulQueueSongHtml.innerHTML += `
            <li class="queueSong" ondblclick="playMusic('${queueSong}', '${currentFolder}', {title: '${metaTags.title}', artist: '${metaTags.artist}', cover: '${metaTags.cover}'})">
                            <div class="queueLeftSide">
                                <div class="queue-number-image convertWhiteTextToLightGrey">
                                    <div class="queue-number">${counter}</div>
                                    <img style="display: none;" class="queue-image" src="icons/playPlaylistWhite.svg" onclick="playMusic('${queueSong}', '${currentFolder}', {title: '${metaTags.title}', artist: '${metaTags.artist}', cover: '${metaTags.cover}'})">
                                </div>
                                <img class="songCoverImgSong" src="${metaTags.cover}" alt="cover">
                                <div class="songAndArtist">
                                    <div class="songName">${metaTags.title}</div>
                                    <div class="artistName convertWhiteTextToLightGrey">${metaTags.artist}</div>
                                </div>
                            </div>

                            <div class="queueRightSide">
                                <img class="iconsRightSideSong controlsScale" onclick="addRemoveSongToLikedSongThroughImg(this, '${queueSong}')" src="${likePath}" alt="Like">
                                <span class="convertWhiteTextToLightGrey">${await hhmm(queueSong)}</span>
                            </div>
                        </li>
            `
            counter++
        }
    }
    Array.from(document.querySelectorAll(".ulSongQueueHtml li")).forEach(element => {
        element.addEventListener("mouseover", () => {
            element.querySelector(".queue-number").style.display = "none"
            element.querySelector(".queue-image").style.display = "inline"
        })
        element.addEventListener("mouseout", () => {
            element.querySelector(".queue-number").style.display = "inline"
            element.querySelector(".queue-image").style.display = "none"
        })
    })
}

async function settingUpSeekbarAndOthers(songRelativePath, metaTags) {
    const currentTimes = document.querySelectorAll(".currentTime")
    const durationTimes = document.querySelectorAll(".durationTime")
    const ranges = document.querySelectorAll(".range")
    let isSeekBarBeingDragged = false

    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const currentTime = currentTimes[i]
        const durationTime = durationTimes[i]

        let durationOfTheSong = Math.floor(await duractionOfAParticularSong(songRelativePath))
        durationTime.innerHTML = hhmmFormat(durationOfTheSong)

        currentSong.addEventListener("timeupdate", () => {
            if (isSeekBarBeingDragged == false) {
                range.value = (currentSong.currentTime / durationOfTheSong) * 100;
                currentTime.innerHTML = hhmmFormat(Math.floor(currentSong.currentTime));
            }
        })

        range.addEventListener("input", () => {
            isSeekBarBeingDragged = true
            let temp = Math.floor((range.value * durationOfTheSong) / 100)
            currentTime.innerHTML = hhmmFormat(temp)
        })

        range.addEventListener("change", () => {
            isSeekBarBeingDragged = false
            currentSong.currentTime = (range.value * durationOfTheSong) / 100;
        })
    }

    for (const iterator of document.querySelectorAll(".currentlyPlayingSongCover")) {
        iterator.src = metaTags.cover
    }
    for (const iterator of document.querySelectorAll(".currentlyPlayingSongName div")) {
        iterator.innerHTML = metaTags.title
    }
    for (const iterator of document.querySelectorAll(".currentlyPlayingArtistname div")) {
        iterator.innerHTML = metaTags.artist
    }
    for (const iterator of document.querySelectorAll(".currentlyPlayingSongLikedOrNot")) {
        if (await songInLikedOrNot(songRelativePath)) {
            iterator.src = "icons/likeFill.svg"
        }
        else {
            iterator.src = "icons/like.svg"
        }
        iterator.addEventListener("click", () => {
            addRemoveSongToLikedSongThroughImg(iterator, absoluteToRelative(currentSong.src))
        })
    }
}

async function getShuffleQueue() {
    function getShuffledList(topString, arr) {
        const shuffledArray = arr.slice();
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        let temp = shuffledArray.filter(item => item !== topString)
        temp.unshift(topString)
        return temp
    }

    LScurrentShuffleQueue = getShuffledList(absoluteToRelative(currentSong.src), LScurrentQueue)
    localStorage.setItem("LScurrentShuffleQueue", JSON.stringify(LScurrentShuffleQueue))
}

async function handlingShuffle() {
    const shuffleButtons = document.querySelectorAll(".shuffle")
    if (LSshuffle == true) {
        for (const iterator of shuffleButtons) {
            iterator.src = "icons/shuffle.svg"
        }
        LSshuffle = false
        localStorage.setItem("LSshuffle", JSON.stringify(LSshuffle))
    }
    else if (LSshuffle == false) {
        for (const iterator of shuffleButtons) {
            iterator.src = "icons/shuffleGreen.svg"
        }
        LSshuffle = true
        localStorage.setItem("LSshuffle", JSON.stringify(LSshuffle))
        await getShuffleQueue()
    }
    setUpQueueHtml()
}

function handlingRepeat() {
    const repeatButtons = document.querySelectorAll(".repeat")
    if (LSrepeat == 0) {
        for (const iterator of repeatButtons) { iterator.src = "icons/repeatGreen.svg" }
        LSrepeat = 1
        localStorage.setItem("LSrepeat", JSON.stringify(LSrepeat))
    }
    else if (LSrepeat == 1) {
        for (const iterator of repeatButtons) { iterator.src = "icons/repeatOneGreen.svg" }
        LSrepeat = 2
        localStorage.setItem("LSrepeat", JSON.stringify(LSrepeat))
    }
    else if (LSrepeat == 2) {
        for (const iterator of repeatButtons) { iterator.src = "icons/repeat.svg" }
        LSrepeat = 0
        localStorage.setItem("LSrepeat", JSON.stringify(LSrepeat))
    }
}

async function previousSong() {
    let queue = JSON.parse(localStorage.getItem("LScurrentQueue"));
    if (LSshuffle == true) {
        queue = JSON.parse(localStorage.getItem("LScurrentShuffleQueue"))
    }
    let index = queue.indexOf(absoluteToRelative(currentSong.src))
    if (index != 0) {
        let previousSong = queue[index - 1]
        let tempMetaTags = await getMetaTags(`${cwd}/${previousSong}`)
        playMusic(previousSong, currentFolder, { title: tempMetaTags.title, artist: tempMetaTags.artist, cover: tempMetaTags.cover })
    }
    else {
        currentSong.currentTime = 0
    }
}

let addedToQueue
async function nextSong() {
    queue = JSON.parse(localStorage.getItem("LScurrentQueue"))
    LSrepeat = JSON.parse(localStorage.getItem("LSrepeat"))
    if (LSshuffle == true) {
        queue = JSON.parse(localStorage.getItem("LScurrentShuffleQueue"))
    }
    let index = queue.indexOf(absoluteToRelative(currentSong.src))

    if (LSrepeat == 0 || LSrepeat == 1) {
        let nextSong
        if (index != (queue.length - 1)) {
            nextSong = queue[index + 1]
        } else {
            nextSong = queue[0]
        }
        let tempMetaTags = await getMetaTags(`${cwd}/${nextSong}`)
        playMusic(nextSong, currentFolder, { title: tempMetaTags.title, artist: tempMetaTags.artist, cover: tempMetaTags.cover })
        if (index == (queue.length - 1) && LSrepeat == 0) {
            playPause()
        }
    } else if (LSrepeat == 2) {
        let nextSong = queue[index]
        let tempMetaTags = await getMetaTags(`${cwd}/${nextSong}`)
        playMusic(nextSong, currentFolder, { title: tempMetaTags.title, artist: tempMetaTags.artist, cover: tempMetaTags.cover })
    }
}

async function playPlaylist() {
    let button = document.querySelector(".playPlayist button")
    if (currentlyOpenedPlaylist == currentFolder) {
        console.log("Same playlist hai bhai");
        playPause()
    }
    else {
        let songsList = (JSON.parse(localStorage.getItem("LSallFoldersSongs")))[relativePathToFolderName(currentlyOpenedPlaylist)]
        let index = 0;
        if (LSshuffle == true) {
            index = Math.floor(Math.random() * songsList.length)
        }
        let firstSong = songsList[index]
        let metaTags = await getMetaTags(`${cwd}/${firstSong}`)
        playMusic(firstSong, currentlyOpenedPlaylist, { title: metaTags.title, artist: metaTags.artist, cover: metaTags.cover })
    }
}

function playPause() {
    const tempButtons = document.querySelectorAll(".playOrPause")
    if (currentSong.paused) {
        currentSong.play()
        for (const iterator of tempButtons) {
            iterator.src = "icons/pauseCircle.svg"
        }
    }
    else {
        currentSong.pause()
        for (const iterator of tempButtons) {
            iterator.src = "icons/playCircle.svg"
        }
    }
}

async function playMusic(songRelativePath, folderName, metaTags, pause = false, tempCurrentTime = null) {
    currentSong.src = songRelativePath
    await settingUpSeekbarAndOthers(songRelativePath, metaTags)

    if (pause != true) {
        playPause()
    }
    currentSong.addEventListener('ended', () => {
        nextSong()
    })
    if (tempCurrentTime !== null) {
        currentSong.currentTime = tempCurrentTime
    }

    LSlastPlayedSong = songRelativePath
    localStorage.setItem("LSlastPlayedSong", JSON.stringify(LSlastPlayedSong))

    currentFolder = folderName
    if (currentFolder == null) {
        LScurrentQueue = squaresQueue
    }
    if (currentFolder != LSfolderRelativePath && currentFolder != null) {
        LSfolderRelativePath = currentFolder
        localStorage.setItem("LSfolderRelativePath", JSON.stringify(LSfolderRelativePath))

        LScurrentQueue = LSallFoldersSongs[relativePathToFolderName(currentFolder)]
        localStorage.setItem("LScurrentQueue", JSON.stringify(LScurrentQueue))

        await getShuffleQueue()
    }

    for (const iterator of document.querySelectorAll(".currentlyPlayingPlaylistName")) {
        let LSfolderRelativePath = JSON.parse(localStorage.getItem("LSfolderRelativePath"))
        iterator.innerHTML = (await (await fetch(`${LSfolderRelativePath}/info.json`)).json()).title
    }

    document.title = `${metaTags.title} - ${metaTags.artist}`
    setScrollingEffects()
    setUpQueueHtml()
}

function addRemoveSongToLikedSongThroughImg(imgElement, songRelativePath) {
    let numberOfLikedSongException = document.querySelector("#numberOfLikedSongException")
    if (absoluteToRelative(imgElement.src) == "icons/like.svg") {
        if (addSongToAPlaylist(songRelativePath, 'Liked', true)) {
            imgElement.src = "icons/likeFill.svg"
            let number = JSON.parse(localStorage.getItem("LSallFoldersSongs"))['Liked'].length
            let singularOrPlural = "songs"
            if (number == 1) {
                singularOrPlural = "song"
            }
            numberOfLikedSongException.innerText = `${number} ${singularOrPlural}`
        }
    }
    else {
        if (removeSongFromAPlaylist(songRelativePath, 'Liked', true)) {
            imgElement.src = "icons/like.svg"
            let number = JSON.parse(localStorage.getItem("LSallFoldersSongs"))['Liked'].length
            let singularOrPlural = "songs"
            if (number == 1) {
                singularOrPlural = "song"
            }
            numberOfLikedSongException.innerText = `${number} ${singularOrPlural}`
        }
    }
}

function addSongToAPlaylist(songRelativePath, folderName, expectReturn = false) {
    let LSallFoldersSongs = JSON.parse(localStorage.getItem("LSallFoldersSongs"))
    if (LSallFoldersSongs[folderName].includes(songRelativePath) == false) {
        LSallFoldersSongs[folderName].unshift(songRelativePath)
        localStorage.setItem("LSallFoldersSongs", JSON.stringify(LSallFoldersSongs))
        if (relativePathToFolderName(currentlyOpenedPlaylist) == folderName) {
            refreshSongsInAPlayist(`songs/${folderName}/`, LSallFoldersSongs[folderName])
            setUpQueueHtml()
        }
        customAlert("Added To Playlist")
        if (expectReturn == true) {
            return true
        }
    }
    else {
        customAlert("Already There In The Playlist");
        if (expectReturn == true) {
            return false
        }
    }

}
function removeSongFromAPlaylist(songRelativePath, folderName, expectReturn = false) {

    let LSallFoldersSongs = JSON.parse(localStorage.getItem("LSallFoldersSongs"))
    if (LSallFoldersSongs[folderName].includes(songRelativePath) == true) {
        LSallFoldersSongs[folderName].splice(LSallFoldersSongs[folderName].indexOf(songRelativePath), 1)
        localStorage.setItem("LSallFoldersSongs", JSON.stringify(LSallFoldersSongs))
        if (relativePathToFolderName(currentlyOpenedPlaylist) == folderName) {
            refreshSongsInAPlayist(`songs/${folderName}/`, LSallFoldersSongs[folderName])
        }
        customAlert("Removed From Playlist")
        if (expectReturn == true) {
            return true
        }
    }
    else {
        customAlert("Not There In The Playlist");
        if (expectReturn == true) {
            return false
        }
    }

}

function addSongToQueue(songRelativePath) {
    let LScurrentQueue = JSON.parse(localStorage.getItem("LScurrentQueue"));
    LScurrentQueue.splice(LScurrentQueue.indexOf(absoluteToRelative(currentSong.src)) + 1, 0, songRelativePath)
    localStorage.setItem("LScurrentQueue", JSON.stringify(LScurrentQueue))

    let shuffleQueue = JSON.parse(localStorage.getItem("LScurrentShuffleQueue"));
    shuffleQueue.splice(shuffleQueue.indexOf(absoluteToRelative(currentSong.src)) + 1, 0, songRelativePath)
    localStorage.setItem("LScurrentShuffleQueue", JSON.stringify(shuffleQueue))

    setUpQueueHtml()
    customAlert("Added To Queue")
}

function customAlert(string, duration = 1000) {
    let alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = string
    alertBox.style.display = 'block';
    alertBox.style.bottom = '90px';

    setTimeout(() => {
        alertBox.style.bottom = '-90px';
        setTimeout(() => alertBox.style.display = 'none', 300);
    }, duration);
}


let toBeAddedToAPlaylist;
function openDialog(songRelativePath) {
    toBeAddedToAPlaylist = songRelativePath
    const overlay = document.getElementById('overlay');
    const dialogBox = document.getElementById('dialogBox');

    overlay.style.display = 'block';
    dialogBox.style.display = 'block';
    dialogBox.style.opacity = '1';
    dialogBox.style.transform = 'translateY(0)';
}


function closeDialog() {
    const overlay = document.getElementById('overlay');
    const dialogBox = document.getElementById('dialogBox');

    overlay.style.display = 'none';
    dialogBox.style.display = 'none';
    dialogBox.style.opacity = '0';
    dialogBox.style.transform = 'translateY(20%)';
}


function processInput(folderName) {
    if (toBeAddedToAPlaylist !== null) {
        addSongToAPlaylist(toBeAddedToAPlaylist, folderName)
        closeDialog()
    }
}

function resetData() {
    localStorage.clear()
    console.log("Data Cleared");
}

function myMessage() {
    console.log("Hey, here are some keyboard shortcuts that might take you some time to find, so why not inform you myself?\n\nSpace: Pause or play\nCtrl/Command + Right Arrow: Next song\nCtrl/Command + Left Arrow: Previous song\nCtrl/Command + Up Arrow: Increase volume by 10 units\nCtrl/Command + Down Arrow: Decrease volume by 10 units\nRight Arrow: Forward the song\nLeft Arrow: Backward the song\nS: Toggle shuffle\nR: Toggle repeat\nQ: Show/close queue\nM: Bring the volume down to 0\nF: Full screen\n\nYou can also control the song using your keyboard's function keys.\n\nType 'resetData()' in the console below to delete all of your data, including your playlist songs, recently played history, etc.");
}


async function main() {
    await getAndPopulateFolders()
    await getGlobalSongs()
    await setLocalStorages()
    jsMediaQueryType()
    setOnClickListenerOnLeftSvg()
    setPreliminaryControlsAndStuff()
    await getAndSetRandomSquares()
}
main()
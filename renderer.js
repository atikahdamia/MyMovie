document.addEventListener("DOMContentLoaded", function () {

    // TMDb API settings
    const apiKey = "YOUR_API_KEY";
    const imageURL = "https://image.tmdb.org/t/p/w500";
    const storageKey = "myWatchlist";
    let watchlist = [];

    // Load saved movies from Local Storage
    function loadMovies() {
        try {
            let data = localStorage.getItem(storageKey);
            watchlist = data ? JSON.parse(data) : [];

            if (!Array.isArray(watchlist)) {
                watchlist = [];
            }

            // Set Plan to Watch for movies with invalid status
            let statusChanged = false;

            for (let i = 0; i < watchlist.length; i++) {
                if (
                    watchlist[i].status !== "Plan to Watch" &&
                    watchlist[i].status !== "Watching" &&
                    watchlist[i].status !== "Watched"
                ) {
                    watchlist[i].status = "Plan to Watch";
                    statusChanged = true;
                }
            }

            if (statusChanged) {
                saveMovies();
            }

        } catch (error) {
            watchlist = [];
            console.log(error);
        }
    }

    // Save watchlist into Local Storage
    function saveMovies() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(watchlist));
            return true;
        } catch (error) {
            alert("Unable to save watchlist.");
            return false;
        }
    }

    // Check API key before sending requests
    function checkApiKey() {
        if (apiKey.trim() === "" || apiKey === "PASTE_YOUR_NEW_TMDB_API_KEY_HERE") {
            alert("Please enter your TMDb API key in renderer.js.");
            return false;
        }

        return true;
    }

    // Get data from TMDb API
    async function fetchAPI(url) {
        let response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to get movie data.");
        }

        return await response.json();
    }

    // Protect text before displaying it
    function escapeHTML(value) {
        let text = String(value || "");
        text = text.replace(/&/g, "&amp;");
        text = text.replace(/</g, "&lt;");
        text = text.replace(/>/g, "&gt;");
        text = text.replace(/"/g, "&quot;");
        text = text.replace(/'/g, "&#39;");
        return text;
    }

    // Format movie duration
    function formatDuration(minutes) {
        if (!minutes || minutes <= 0) return "Not available";

        let hours = Math.floor(minutes / 60);
        let mins = minutes % 60;

        if (hours > 0 && mins > 0) return hours + "h " + mins + "m";
        if (hours > 0) return hours + "h";

        return mins + "m";
    }

    // Get movie poster image
    function getPoster(path) {
        if (path) return imageURL + path;
        return "https://via.placeholder.com/300x450?text=No+Poster";
    }

    // Prepare movie information for the watchlist
    function createMovie(data) {
        return {
            id: data.id,
            title: data.title,
            poster_path: data.poster_path,
            release_date: data.release_date,
            vote_average: data.vote_average,
            overview: data.overview,
            runtime: data.runtime || null,
            status: "Plan to Watch"
        };
    }

    // Add a movie to the watchlist
    function addMovie(movie) {
        for (let i = 0; i < watchlist.length; i++) {
            if (watchlist[i].id == movie.id) return false;
        }

        watchlist.unshift(movie);

        if (!saveMovies()) {
            watchlist.pop();
            return false;
        }

        return true;
    }

    // Change the movie watching status
    function updateMovie(id, status) {
        let validStatuses = ["Plan to Watch", "Watching", "Watched"];

        if (validStatuses.indexOf(status) === -1) {
            return false;
        }

        for (let i = 0; i < watchlist.length; i++) {
            if (watchlist[i].id == id) {
                let oldStatus = watchlist[i].status;
                watchlist[i].status = status;

                if (!saveMovies()) {
                    watchlist[i].status = oldStatus;
                    return false;
                }

                return true;
            }
        }

        return false;
    }

    // Remove a movie from the watchlist
    function removeMovie(id) {
        let oldList = watchlist.slice();
        let newList = [];

        for (let i = 0; i < watchlist.length; i++) {
            if (watchlist[i].id != id) {
                newList.push(watchlist[i]);
            }
        }

        if (newList.length == oldList.length) return false;

        watchlist = newList;

        if (!saveMovies()) {
            watchlist = oldList;
            return false;
        }

        return true;
    }

    // Add movie and show feedback
    function addToWatchlist(movie) {
        let newMovie = createMovie(movie);

        if (addMovie(newMovie)) {
            alert("Movie added to your watchlist!");
        } else {
            alert("This movie is already in your watchlist.");
        }
    }

    // Open movie details when poster is clicked
    function openMovieDetails(id) {
        getMovieDetails(id);
    }

    // Create one movie card for search and suggestions
    function createMovieCard(movie, area, extraInfo) {
        let card = document.createElement("div");
        card.className = "movie-card";

        card.innerHTML =
            '<img src="' + getPoster(movie.poster_path) + '" alt="Movie poster" title="Click poster to view details">' +
            "<h3>" + escapeHTML(movie.title) + "</h3>" +
            "<p>Release Date: " + escapeHTML(movie.release_date || "Unknown") + "</p>" +
            "<p>⭐Rating: " + Number(movie.vote_average || 0).toFixed(1) + "</p>" +
            (extraInfo || "") +
            '<button class="add-button" type="button">+ Add to Watchlist</button>';

        area.appendChild(card);

        // Open details when poster is clicked
        card.querySelector("img").addEventListener("click", function () {
            openMovieDetails(movie.id);
        });

        // Add movie using the button
        card.querySelector(".add-button").addEventListener("click", function () {
            addToWatchlist(movie);
        });
    }

    // Display movie results from TMDb
    function displayMovies(movies, area) {
        area.innerHTML = "";

        if (!movies || movies.length === 0) {
            area.textContent = "No movies found.";
            return;
        }

        for (let i = 0; i < movies.length; i++) {
            createMovieCard(movies[i], area, "");
        }
    }

    // Search movies by title
    async function searchMovies() {
        if (!checkApiKey()) return;

        let title = document.getElementById("movieInput").value.trim();
        let results = document.getElementById("movieResults");

        if (title === "") {
            alert("Please enter a movie title.");
            return;
        }

        results.textContent = "Searching movies...";

        try {
            let url = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&query=" + encodeURIComponent(title);
            let data = await fetchAPI(url);

            displayMovies(data.results, results);

        } catch (error) {
            results.textContent = "Unable to search movies. Please try again.";
            console.log(error);
        }
    }

    // Show full movie information in the details modal
    function showMovieModal(movie) {
        let modal = document.getElementById("movieModal");

        if (!modal) {
            modal = document.createElement("div");
            modal.id = "movieModal";
            modal.className = "movie-modal";
            document.body.appendChild(modal);
        }

        // Get movie genres
        let genres = "Not available";

        if (movie.genres && movie.genres.length > 0) {
            genres = "";

            for (let i = 0; i < movie.genres.length; i++) {
                if (i > 0) genres += ", ";
                genres += escapeHTML(movie.genres[i].name);
            }
        }

        // Get movie director
        let director = "Not available";

        if (movie.credits && movie.credits.crew) {
            for (let i = 0; i < movie.credits.crew.length; i++) {
                if (movie.credits.crew[i].job === "Director") {
                    director = escapeHTML(movie.credits.crew[i].name);
                    break;
                }
            }
        }

        // Display movie details in the modal
        modal.innerHTML =
            '<div class="movie-modal-content">' +
                '<button class="modal-close-button" id="closeMovieModal" type="button">×</button>' +
                '<div class="movie-modal-layout">' +
                    '<div class="movie-modal-poster">' +
                        '<img src="' + getPoster(movie.poster_path) + '" alt="Movie poster">' +
                    '</div>' +
                    '<div class="movie-modal-info">' +
                        "<h2>" + escapeHTML(movie.title) + "</h2>" +
                        "<p><strong>Release Date:</strong> " + escapeHTML(movie.release_date || "Unknown") + "</p>" +
                        "<p><strong>Genre:</strong> " + genres + "</p>" +
                        "<p><strong>Runtime:</strong> " + formatDuration(movie.runtime) + "</p>" +
                        "<p><strong>Rating:</strong> " + Number(movie.vote_average || 0).toFixed(1) + "</p>" +
                        "<p><strong>Director:</strong> " + director + "</p>" +
                        "<p><strong>Overview:</strong> " + escapeHTML(movie.overview || "No overview available.") + "</p>" +
                        '<button id="modalAddButton" type="button">+ Add to Watchlist</button>' +
                    "</div>" +
                "</div>" +
            "</div>";

        modal.style.display = "flex";

        // Close the details modal
        document.getElementById("closeMovieModal").addEventListener("click", function () {
            modal.style.display = "none";
        });

        // Add movie from the details modal
        document.getElementById("modalAddButton").addEventListener("click", function () {
            addToWatchlist(movie);
        });

        // Close modal when clicking outside the content
        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
    }

    // Get full movie details and director information
    async function getMovieDetails(id) {
        if (!checkApiKey()) return;

        try {
            let url = "https://api.themoviedb.org/3/movie/" + id + "?api_key=" + apiKey + "&append_to_response=credits";
            let movie = await fetchAPI(url);

            showMovieModal(movie);

        } catch (error) {
            alert("Unable to load movie details.");
            console.log(error);
        }
    }

    // Display simple movie cards for Explore Movies
    function displayExploreMovies(movies, area) {
        area.innerHTML = "";

        if (!movies || movies.length === 0) {
            area.textContent = "No movies available.";
            return;
        }

        for (let i = 0; i < movies.length; i++) {
            let card = document.createElement("div");
            card.className = "movie-card";

            card.innerHTML =
                '<img src="' + getPoster(movies[i].poster_path) + '" alt="Movie poster">' +
                "<h3>" + escapeHTML(movies[i].title) + "</h3>";

            area.appendChild(card);
        }
    }

    // Load popular movies for Explore Movies
    async function getExploreMovies() {
        let area = document.getElementById("topRatedResults");

        if (!area) return;
        if (!checkApiKey()) return;

        area.textContent = "Loading movies...";

        try {
            let url = "https://api.themoviedb.org/3/movie/popular?api_key=" + apiKey;
            let data = await fetchAPI(url);

            displayExploreMovies(data.results, area);

        } catch (error) {
            area.textContent = "Unable to load movies.";
            console.log(error);
        }
    }

    // Match selected genre with TMDb genre ID
    function isGenreMatch(movie, genre) {
        if (genre === "") return true;
        if (!movie.genre_ids) return false;

        if (genre === "Action") {
            return movie.genre_ids.indexOf(28) !== -1;
        } else if (genre === "Comedy") {
            return movie.genre_ids.indexOf(35) !== -1;
        } else if (genre === "Horror") {
            return movie.genre_ids.indexOf(27) !== -1;
        } else if (genre === "Romance") {
            return movie.genre_ids.indexOf(10749) !== -1;
        } else if (genre === "Animation") {
            return movie.genre_ids.indexOf(16) !== -1;
        }

        return false;
    }

    // Find movies based on available time and selected genre
    async function findMoviesByDuration() {
        if (!checkApiKey()) return;

        let hoursText = document.getElementById("durationHours").value.trim();
        let minutesText = document.getElementById("durationMinutes").value.trim();
        let genre = document.getElementById("durationGenre").value;
        let results = document.getElementById("durationResults");
        let hasTime = hoursText !== "" || minutesText !== "";

        // Check whether the user entered time or selected a genre
        if (!hasTime && genre === "") {
            alert("Enter your available time or select a genre.");
            return;
        }

        // Validate hours and minutes
        let hours = Number(hoursText || 0);
        let minutes = Number(minutesText || 0);

        if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
            alert("Please enter valid hours and minutes.");
            return;
        }

        let totalMinutes = hours * 60 + minutes;

        if (hasTime && totalMinutes <= 0) {
            alert("Available time must be more than zero.");
            return;
        }

        results.textContent = "Finding suitable movies...";

        try {
            let movies = [];
            let page = 1;

            // Search up to 3 pages and suggest up to 15 movies
            while (page <= 3 && movies.length < 15) {
                let url = "https://api.themoviedb.org/3/discover/movie?api_key=" + apiKey + "&sort_by=popularity.desc&page=" + page;
                let data = await fetchAPI(url);

                for (let i = 0; i < data.results.length && movies.length < 15; i++) {
                    let movie = data.results[i];

                    // Only suggest movies with rating 7 or above
                    if (movie.vote_average < 7) continue;

                    // Check selected genre
                    if (!isGenreMatch(movie, genre)) continue;

                    // Check movie runtime
                    if (hasTime) {
                        try {
                            let detailURL = "https://api.themoviedb.org/3/movie/" + movie.id + "?api_key=" + apiKey;
                            let details = await fetchAPI(detailURL);

                            if (!details.runtime || details.runtime > totalMinutes) continue;

                            movie.runtime = details.runtime;
                            movie.remainingMinutes = totalMinutes - details.runtime;

                        } catch (error) {
                            console.log("Unable to check movie runtime.");
                            continue;
                        }
                    }

                    movies.push(movie);
                }

                page++;
            }

            displaySuggestions(movies, results, hasTime);

        } catch (error) {
            results.textContent = "Unable to find movies. Please try again.";
            console.log(error);
        }
    }

    // Display movies that match the selected conditions
    function displaySuggestions(movies, area, hasTime) {
        area.innerHTML = "";

        if (movies.length === 0) {
            area.textContent = "No suitable movies found. Try another time or genre.";
            return;
        }

        let heading = document.createElement("h3");
        heading.textContent = "Suggested Movies";
        area.appendChild(heading);

        for (let i = 0; i < movies.length; i++) {
            let extraInfo = "";

            if (hasTime) {
                extraInfo = "<p>Runtime: " + formatDuration(movies[i].runtime) + "</p>" +
                    "<p>Remaining Time: " + formatDuration(movies[i].remainingMinutes) + "</p>";
            }

            createMovieCard(movies[i], area, extraInfo);
        }
    }

    // Display saved movies on the Watchlist page
    function displayWatchlist() {
        let area = document.getElementById("watchlistResults");

        if (!area) return;

        area.innerHTML = "";

        if (watchlist.length === 0) {
            area.textContent = "Your watchlist is empty.";
            return;
        }

        for (let i = 0; i < watchlist.length; i++) {
            let movie = watchlist[i];
            let card = document.createElement("div");
            card.className = "watchlist-card";

            card.innerHTML =
                '<img src="' + getPoster(movie.poster_path) + '" alt="Movie poster" title="Click to view details">' +
                '<div class="watchlist-info">' +
                    "<h3>" + escapeHTML(movie.title) + "</h3>" +
                    "<p>Release Date: " + escapeHTML(movie.release_date || "Unknown") + "</p>" +
                    "<p>Rating: " + Number(movie.vote_average || 0).toFixed(1) + "</p>" +
                    "<p>Runtime: " + formatDuration(movie.runtime) + "</p>" +
                    '<label for="status-' + movie.id + '">Movie Status:</label>' +
                    '<select class="status-select" id="status-' + movie.id + '">' +
                        '<option value="Plan to Watch">Plan to Watch</option>' +
                        '<option value="Watching">Watching</option>' +
                        '<option value="Watched">Watched</option>' +
                    "</select>" +
                    '<button class="delete-button" type="button">Delete</button>' +
                "</div>";

            area.appendChild(card);

            // Set the current movie status
            let select = card.querySelector(".status-select");

            if (
                movie.status !== "Plan to Watch" &&
                movie.status !== "Watching" &&
                movie.status !== "Watched"
            ) {
                movie.status = "Plan to Watch";
                saveMovies();
            }

            select.value = movie.status;

            // Update movie status when selection changes
            select.addEventListener("change", function () {
                if (updateMovie(movie.id, select.value)) {
                    alert("Movie status updated.");
                } else {
                    alert("Unable to update movie status.");
                    select.value = movie.status;
                }
            });

            // Delete movie from watchlist
            card.querySelector(".delete-button").addEventListener("click", function () {
                if (confirm("Are you sure you want to delete this movie?")) {
                    if (removeMovie(movie.id)) {
                        displayWatchlist();
                    }
                }
            });

            // Open movie details when poster is clicked
            card.querySelector("img").addEventListener("click", function () {
                openMovieDetails(movie.id);
            });
        }
    }

    // Load saved movies when the application starts
    loadMovies();

    // Add search button and Enter key events
    let searchButton = document.getElementById("searchButton");
    let movieInput = document.getElementById("movieInput");

    if (searchButton && movieInput) {
        searchButton.addEventListener("click", searchMovies);

        movieInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") searchMovies();
        });

        getExploreMovies();
    }

    // Add Duration Finder button event
    let durationButton = document.getElementById("durationButton");

    if (durationButton) {
        durationButton.addEventListener("click", findMoviesByDuration);
    }

    // Display watchlist when the Watchlist page opens
    displayWatchlist();

});

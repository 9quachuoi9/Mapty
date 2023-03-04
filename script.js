'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    // just example about run method on other class
    // click = 0;
    constructor(coords, distance, duration) {
        this.coords = coords; // [lat, lgn]
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription() {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(
            1
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }

    // ------
    // click() {
    //     this.click++;
    // }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App {
    #map;
    #mapEvent;
    #workouts = [];
    #zoomLevel = 13;

    constructor() {
        // get user position
        this._getPosition();

        // attach event handler
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveToPopup.bind(this)
        );

        // get data from local storage
        this._getLocalStorage();
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Can not access the location');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];
        // can phai co mot tag html co id la map de hien thi map len trinh duyet
        this.#map = L.map('map').setView(coords, this.#zoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        // handle click on map
        this.#map.on('click', this._showForm.bind(this));

        // when map loaded this method will run
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapEv) {
        this.#mapEvent = mapEv;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        // empty input
        inputCadence.value =
            inputDistance.value =
            inputDuration.value =
            inputElevation.value =
                '';
        // comment line 1 & 3 to see the difference
        // form.style.display = 'none';
        form.classList.add('hidden');
        // setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _toggleElevationField() {
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        const validInput = (...inputs) =>
            inputs.every(input => Number.isFinite(input));
        const allPositive = (...inputs) => inputs.every(input => input > 0);
        //
        e.preventDefault();
        // get data from form
        const type = inputType.value;
        const distance = +inputDistance.value; // '+' change value from string to number
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        // if workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // check valid input
            if (
                !validInput(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Input have to be positive number');

            workout = new Running([lat, lng], distance, duration, cadence);
        }
        // if workout cycling, create cycling object
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            // check valid input
            if (
                !validInput(distance, duration, elevationGain) ||
                !allPositive(distance, duration)
            )
                return alert('Input have to be positive number');

            workout = new Cycling(
                [lat, lng],
                distance,
                duration,
                elevationGain
            );
        }
        // Add new object to workout array

        this.#workouts.push(workout);
        // render workout on map as marker
        this._renderWorkoutMarker(workout);

        // render workout on the list
        this._renderWorkout(workout);

        // set local storage to all workout
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    //   maxWidth: 300,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(workout.description)
            .openPopup();
        // clear input fields
        this._hideForm();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type === 'running' ? '🏃‍' : '🚴'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div> 
        `;

        if (workout.type === 'running') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }
        if (workout.type === 'cycling') {
            html += `
            
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#zoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

        // using the public interface
        // workout.click();
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }
}

const app = new App();

import { Component, OnInit, OnDestroy } from '@angular/core';
import { combineLatest, Subscription } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';

import { SessionsService } from 'src/app/services/sessions.service';
import { Session } from 'src/app/models/session';
import { FilmSessions } from 'src/app/models/filmSessions';
import { FilmsService } from 'src/app/services/films.service';
import { Film } from 'src/app/models/film';
import { isValidDate } from '../../../utils/date';
import { SessionFilter } from 'src/app/models/sessionFilter';
import { BasePageComponent } from 'src/app/components/base-page.component';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent extends BasePageComponent implements OnInit, OnDestroy {

  constructor(private sessionsService: SessionsService,
              private filmsService: FilmsService,
              private route: ActivatedRoute,
              private router: Router) {
    super();
  }

  public sessions: Session[];
  public sessionsLoading: boolean;
  public filmsSessions: FilmSessions[];
  public filteredFilmsSessions: FilmSessions[];
  public selectedSession: Session;
  public availableDates: Date[];
  public initialDate: Date;
  public sessionTypesForm: FormGroup;
  public currentDateSelected: Date;

  public get control2D(): AbstractControl {
    return this.sessionTypesForm.get('2D');
  }

  public get control3D(): AbstractControl {
    return this.sessionTypesForm.get('3D');
  }

  public get noSessionsForCurrentDay(): boolean {
    return this.filteredFilmsSessions.every(f => f.sessions.length === 0);
  }

  private films: Film[];

  private paramsSubscription: Subscription;

  ngOnInit() {
    this.sessionsLoading = true;
    combineLatest([this.sessionsService.getAllSessions(), this.filmsService.getFilms()])
      .subscribe(([sessions, films]) => {
        this.sessions = sessions;
        this.films = films;
        this.sessionsLoading = false;
        this.createFilmsSessions();
        this.createDates();
        this.createInitialFiltersFromQuery();
      });

    this.paramsSubscription = this.route.queryParams
      .subscribe((params) => this.onQueryParamsChanged(params));

    // this.route.snapshot.queryParamMap
    this.sessionTypesForm = new FormGroup({
      '2D': new FormControl(false),
      '3D': new FormControl(false)
    });
  }

  private onQueryParamsChanged(params: Params) {
    if (this.filmsSessions) {
      this.updateSessionsByFilters(params);
    }
  }

  private updateQueryParams(filter: SessionFilter) {

    const params: Params = Object.keys(filter)
      .reduce((accum, key) => {
        if (filter[key]) {
          accum[key] = filter[key];
        }
        return accum;
      }, {});

    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
      });
  }

  private updateSessionsByFilters(filters: SessionFilter) {
    this.filteredFilmsSessions = this.filmsSessions.map(filmsSession => {

      let filteredSessions: Session[] = filmsSession.sessions;

      // handle case without filters;
      const dateToFilterBy: string = filters.date ||
        (this.currentDateSelected && this.currentDateSelected.toDateString()) ||
        new Date().toDateString();

      filteredSessions = filmsSession.sessions
        .filter(s => new Date(s.timestamp).toDateString() == dateToFilterBy);

      if (filters.sessionTypes) {
        try {
          const sessionTypes: string[] = JSON.parse(filters.sessionTypes) || [];
          this.setInitialSessionsTypesFormValues(sessionTypes);
          if (sessionTypes.length) {
            filteredSessions = filteredSessions.filter(s => sessionTypes.includes(s.sessionType));
          }
        } catch (err) { }
      }

      return { ...filmsSession, sessions: filteredSessions };
    });
  }

  private createFilmsSessions() {
    const filmsIdsToSessionsMap = new Map<string, Session[]>();
    for (const session of this.sessions) {
      const currentFilmSessions = filmsIdsToSessionsMap.get(session.film.id) || [];
      filmsIdsToSessionsMap.set(session.film.id, [...currentFilmSessions, session]);
    }

    this.filmsSessions = [];
    for (const filmId of filmsIdsToSessionsMap.keys()) {
      const film = this.films.find(f => f.id === filmId);
      if (film) {
        const sortedSessions = filmsIdsToSessionsMap.get(filmId).sort((s1, s2) => s1.timestamp > s2.timestamp ? 1 : -1);
        this.filmsSessions.push({ film, sessions: sortedSessions });
      }
    }
    this.filteredFilmsSessions = [...this.filmsSessions];
  }

  private createDates() {
    this.availableDates = this.sessions.map(s => new Date(s.timestamp));
  }

  private createInitialFiltersFromQuery() {
    const date = new Date(this.route.snapshot.queryParamMap.get('date'));
    if (isValidDate(date)) {
      this.initialDate = date;
    } else {
      this.initialDate = null;
    }
    let initialSessionsTypes: string[] = [];
    try {
      initialSessionsTypes = JSON.parse(this.route.snapshot.queryParamMap.get('sessionTypes'));
    } catch (err) { }

    this.updateSessionsByFilters({
      date: date.toDateString(),
      sessionTypes: JSON.stringify(initialSessionsTypes)
    });

    this.setInitialSessionsTypesFormValues(initialSessionsTypes);
  }

  setInitialSessionsTypesFormValues(values: string[]) {
    if (!values) {
      return;
    }
    values.forEach((curr) => {
      this.sessionTypesForm.get(curr).setValue(true);
    });
  }

  trackByFn(index: number, fs: FilmSessions) {
    const filmId = fs.film.id;
    const sessionId = fs.sessions && fs.sessions.length ? fs.sessions[0] : '';
    return `${filmId}_${sessionId}`;
  }

  onCloseSessionDetails() {
    setTimeout(() => {
      this.selectedSession = null;
    }, 0);
  }

  onSessionsFormChange() {
    const sessionTypes = Object.keys(this.sessionTypesForm.value)
      .filter(key => this.sessionTypesForm.value[key]);
    this.updateQueryParams({ sessionTypes: JSON.stringify(sessionTypes) });
  }

  onTimeSelected(session: Session) {
    this.selectedSession = session;
  }

  onDateSelected(date: Date) {
    this.currentDateSelected = date;
    this.updateQueryParams({ date: date.toDateString() });
  }

  ngOnDestroy(): void {
    this.paramsSubscription.unsubscribe();
  }

}

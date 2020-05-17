import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Session } from 'src/app/models/session';
import { Ticket } from 'src/app/models/ticket';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription, combineLatest } from 'rxjs';
import { User } from 'src/app/models/user';
import { FormControl, Validators } from '@angular/forms';
import { SessionsService } from 'src/app/services/sessions.service';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, OnDestroy {

  @Input() session: Session;
  @Output() close = new EventEmitter();

  public tickets: Ticket[] = [];
  public currentUser: User;

  public emailControl: FormControl;

  private authServiceSubsription: Subscription;

  public get totalTicketsPrice(): number {
    return this.tickets.reduce((sum, t) => t.price + sum, 0);
  }

  constructor(public authService: AuthService,
              public sessionsService: SessionsService,
              public baseService: BaseService) { }

  ngOnInit() {
    this.authServiceSubsription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });

    this.emailControl = new FormControl('', [ Validators.email, Validators.required ]);
  }

  public isSittingSelected(row: number, col: number) {
    return this.tickets.some(t => t.row == row && t.col == col);
  }

  public onPlaceSelected(row: number, col: number) {
    if (this.session.sittings[row][col]) {
      return;
    }

    if (this.isSittingSelected(row, col)) {
      this.tickets = this.tickets.filter(t => !(t.row == row && t.col == col));
    } else {
      const ticket: Ticket = {
        row,
        col,
        film: this.session.film,
        sessionId: this.session.id,
        room: this.session.room,
        price: this.session.room.price,
        timestamp: this.session.timestamp
      };

      if (this.currentUser) {
        ticket.user = this.currentUser;
      }

      this.tickets.push(ticket);
    }
  }

  onBuyClicked(): void {
    if (!this.currentUser && this.emailControl.invalid || !this.tickets.length) {
      this.emailControl.markAsDirty();
      return;
    }

    combineLatest(
      this.tickets.map(t => this.sessionsService.updateSessionWithTicket(this.session, t))
    ).subscribe(tickets => {
      this.tickets = [];
      this.close.emit();
    })

  }

  ngOnDestroy(): void {
    this.authServiceSubsription.unsubscribe();
  }

}
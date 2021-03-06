import { Component, OnInit } from '@angular/core';
import { Ticket } from 'src/app/models/ticket';
import { TicketsService } from 'src/app/services/tickets.service';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BasePaginationComponent } from 'src/app/components/base-pagination.component';
import { PaginationService } from 'src/app/services/pagination.service';

@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss']
})
export class TicketsComponent extends BasePaginationComponent implements OnInit {

  public tickets: Ticket[];
  public ticketsLoading: boolean;
  public get paginatedTickets(): Ticket[] {
    if (!this.tickets) {
      return null;
    }

    return this.tickets.slice(this.offset,
                               this.limit + this.offset);
  }
  public selectedTicket: Ticket;

  constructor(private ticketsService: TicketsService,
              private authService: AuthService,
              public route: ActivatedRoute,
              public router: Router,
              private paginationService: PaginationService) {
    super(route, router, paginationService);
    this.paginationService.routePrefix.next(['tickets']);
  }

  ngOnInit() {
    this.ticketsLoading = true;
    this.ticketsService.getUserTickets(this.authService.currentUser.getValue().id)
      .subscribe(tickets => {
        this.tickets = tickets;
        this.ticketsLoading = false;
      });
    super.ngOnInit();
  }

  public onTicketClicked(ticket: Ticket) {
    if (this.selectedTicket && this.selectedTicket.id === ticket.id) {
      this.selectedTicket = null;
    } else {
      this.selectedTicket = ticket;
    }
  }

  public getTicketQRData(ticket: Ticket): string {
    return JSON.stringify({
      id: ticket.id,
      sessionId: ticket.sessionId,
      filmId: ticket.film.id,
      userId: ticket.userId,
      someServerSecret: 'Some secret server token which will be valid only on session date',
      row: ticket.row + 1,
      sitting: ticket.col + 1
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from 'src/entities/ticket.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TicketsService {

   @InjectRepository(Ticket) private ticketRepo: Repository<Ticket>

  constructor (private readonly userService: UsersService){

  }
  create(createTicketDto: CreateTicketDto) {
    return 'This action adds a new ticket';
  }

  findAll() {
    return `This action returns all tickets`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticket`;
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }

  async getUserTickets(userId: number){
    const user = await this.userService.findOne(userId)
    if(!user) throw new NotFoundException("User not found for this ticket")
    const query = this.ticketRepo.createQueryBuilder('ticket')
    .leftJoinAndSelect('ticket.booking', 'booking')
    .where('booking.user.id = :userId', {userId})


    const [items, total] = await query.getManyAndCount();
    console.log("Tickets in service: ", items)

    return {
      items,
      total
    }
    

  }
}

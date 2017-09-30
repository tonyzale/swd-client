import { Component, Injectable, Input, Output, EventEmitter } from '@angular/core';
import { Character, Upgrade, Support } from '../../../swd/game/game';
import { Card } from '../../../swd/game/cards';
import { Chat, ClientGameState, Modal, ModalSelection, SerializedTurnAction } from '../../../swd/game/json_payload';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {
    socket = io('http://100.115.92.2:3000');
    // socket = io('http://0.0.0.0:3000');
}

interface ModalContent {
    id: string;
    title: string;
    text: string;
    options: any[];
};

@Injectable()
export class ModalService {
    showModal(data: Modal) {
        throw new Error('using modal before init');
    }
};

@Component({
    selector: 'modal',
    templateUrl: 'modal.html',
    styleUrls: ['modal.css']
})
export class ModalComponent {
    constructor(private socketService: SocketService) { }
    @Input() content: ModalContent;
    @Output() closeModal = new EventEmitter<boolean>();
    clickedClose() {
        this.closeModal.emit(false);
    }
    clickedOption(option: number) {
        let selection: ModalSelection = {
            content_id: this.content.id,
            choice: this.content.options[option].text
        };
        this.socketService.socket.emit('choice', JSON.stringify(selection));
        this.closeModal.emit(true);
    }
};

class ClientCard extends Card {
    public moves: SerializedTurnAction[];
};

class ClientChar extends Character {
    public moves: SerializedTurnAction[];
    public card: ClientCard;
};
class ClientUpgrade extends Upgrade {
    public moves: SerializedTurnAction[];
    public card: ClientCard;
}
class ClientSupport extends Support {
    public moves: SerializedTurnAction[];
    public card: ClientCard;
}

@Component({
    selector: 'app-root',
    templateUrl: './game.html',
    styleUrls: ['./game.css']
})
export class AppComponent {
    constructor(private socketService: SocketService, private modalService: ModalService) {
        let app = this;
        socketService.socket.on('state', function(state: string) {
            console.log('got state');
            app.game_state = JSON.parse(state);
        });

        socketService.socket.on('connect', function() {
            app.setName();
        });

        socketService.socket.on('message', function(msg: Chat) {
            app.messages.push(msg);
        });

        socketService.socket.on('roster', function(names: string[]) {
            app.roster = names;
        });

        socketService.socket.on('moves', function(moves: string) {
            app.moves = JSON.parse(moves);
            app.clearMovesFromCards();
            app.game_state.player.hand.forEach(function(c: ClientCard) {
                c.moves = app.movesForCard(c);
            });
            app.game_state.player.characters.forEach(function(char: ClientChar) {
                char.card.moves = app.movesForCard(<ClientCard>char.card);
                char.upgrades.forEach(function(u: ClientUpgrade) {
                    u.card.moves = app.movesForCard(<ClientCard>u.card);
                });
            });
            app.game_state.player.supports.forEach(function(support: ClientSupport) {
                support.card.moves = app.movesForCard(support.card);
            });
        });

        socketService.socket.on('modal', function(data: string) {
            app.modal_data = JSON.parse(data);
        });

        modalService.showModal = (data: Modal) => {
            app.show_modal = true;
            app.modal_data = data;
        };
    }
    title = 'app';
    messages: Chat[] = [];
    roster: any[] = [];
    name: string = '';
    text: string = '';
    card_width = 150;
    card_height = this.card_width * 1.4;
    moves: SerializedTurnAction[] = [];
    show_modal: boolean = false;
    modal_data: Modal;
    closeModal(actionSelected: boolean) {
        this.show_modal = false;
    }

    movesForCard(card: Card): SerializedTurnAction[] {
        return this.moves.filter(function(m) {
            return (m.card_id && (m.card_id == card.id));
        });
    };

    setName(): void {
        this.socketService.socket.emit('identify', this.name);
    };
    clearMovesFromCards(): void {
        this.game_state.player.hand.forEach(function(c: ClientCard) {
            c.moves = [];
        });
    };
    game_state: ClientGameState;
    send(): void {
        console.log('Sending message:', this.text);
        this.socketService.socket.emit('message', this.text);
        this.text = '';
    };
};

@Component({
    selector: 'card',
    templateUrl: 'card.html',
    styleUrls: ['game.css']
})
export class CardComponent {
    constructor(private modalService: ModalService) {
    }
    border_width: number;
    @Input() width: number;
    @Input() height: number;
    @Input() left: number;
    @Input() top: number;
    @Input() card: ClientCard;
    @Input() back: string;
    @Input() state: number; 0
    @Input() overlay: string;
    imgPath(): string {
        if (this.back && this.back === 'yes') {
            return "http://www.cardgamedb.com/deckbuilders/starwarsdestiny/swd-cardback.png";
        }
        if (!this.card) {
            throw new Error('no back or card');
        }
        return this.card.json.imagesrc;
    };
    wrapWidth(): number {
        if (this.card && this.state == 1) {
            return this.height;
        } else {
            return this.width;
        }
    }
    borderCss(): string {
        if (this.card && this.card.moves && this.card.moves.length > 0) {
            return '3px solid lime';
        } else {
            return '3px solid rgba(0,0,0,0)';
        }
    }
    clickCard() {
        let modal_data: Modal = {
            id: 'modalid',
            title: this.card.name,
            text: 'Options:',
            options: []
        };
        this.card.moves.forEach((m: SerializedTurnAction, i: number) => {
            modal_data.options.push({
                card_id: this.card.id,
                option_idx: i,
                text: JSON.stringify(m)
            })
        });
        this.modalService.showModal(modal_data);
    };

};

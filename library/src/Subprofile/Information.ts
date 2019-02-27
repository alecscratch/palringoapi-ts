import { Dictionary } from './../Polyfill/Dictionary';
import { Client } from './../Networking/Client';
import { ExtendedUser, User, Group, IHistoricalMessage } from './Subprofile';
import { UserProfile, GroupList, GroupProfile, ConversationHistory, MessageHistory } from './../Networking/PacketTemplate';

export class Information {

    static cache: boolean = true;

    public CachedUsers: Dictionary<Number, (ExtendedUser)>;
    public Groups: Dictionary<Number, Group>;

    constructor(private con: Client, 
        public MyProfile: ExtendedUser) {
        
        this.CachedUsers = new Dictionary<Number, (ExtendedUser)>();
        this.CachedUsers.add(MyProfile.id, MyProfile);
        this.Groups = new Dictionary<Number, Group>();
    }

    requestUser(id: number, callback?: (user: (ExtendedUser)) => void) {
        if (this.CachedUsers.contains(id)) {
            if (callback) callback(this.CachedUsers.get(id));
            return;
        }

        this.con.writePacketAdv(UserProfile(id, true), (resp : (ExtendedUser)) => {
            if (callback)
                callback(resp);
            
            if (Information.cache) {
                this.CachedUsers.add(id, resp);
            }
        });
    }

    requestGroup(id: number, callback?: (group: (Group)) => void) {
        if (this.Groups.contains(id)) {
            if (callback) callback(this.Groups.get(id));
            return;
        }

        this.con.writePacketAdv(GroupProfile(id, true), (resp: (Group)) => {
            if (callback)
                callback(resp);
        });
    }

    requestGroups(callback?: (groups: (Group[])) => void) {
        this.con.writePacketAdv(GroupList(), (groups: Group[]) => {
            for(let g of groups) {
                this.requestGroup(g.id, (grp) => {
                    this.Groups.add(grp.id, grp);
                });
            }

            if (callback)
                callback(groups);
        });
    }

    conversationList(from: Date, callback?: (history: IHistoricalMessage[]) => void) {
        this.con.writePacketAdv(ConversationHistory(from), (thing : IHistoricalMessage[]) => {
            if (callback)
                callback(thing);
        }, (d) => {
            console.log('Convertsation list: ', d);
        });
    }

    messageHistory(id: number, from: Date, group: boolean, callback?: (thing) => void) {
        var f = from.getTime();
        var p = MessageHistory(id, f, group);
        this.con.writePacketAdv(p, (thing) => {
            if (callback)
                callback(thing);
        }, (d) => {
            console.log('Error fetching message history', d, p);
        });
    }
}
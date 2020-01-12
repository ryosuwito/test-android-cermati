import { Component, Renderer } from '@angular/core';
import { GlobalService } from '../global.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  data: any
  header: any
  nextUrl: string
  rateLimit: number
  remainingRate: number
  query = ""
  users: any = []
  searchTimeout: any
  isNotFound
  isNoInternet
  isLimitReached
  loading

  constructor(public global: GlobalService,
    public loadingCtrl: LoadingController,
    public renderer: Renderer) {
    console.log('ionViewDidLoad HomePage')
    this.initialize()
  }

  initialize(){
    this.isNoInternet = false
    this.isNotFound = false
    this.isLimitReached = false
  }

  fetchData(query, nextUrl?) {
    this.presentLoading()
    this.initialize()
    if(!this.nextUrl){
      this.users = []
    }
    this.global.httpRequest(query, nextUrl).then((resolve: any) => {
      console.log(resolve)
      this.header = resolve.header
      this.data = resolve.data
      this.dismissLoading()

      //to check if we got empty response
      if (this.data.total_count == 0) {
        this.isNotFound = true
        return
      }

      this.users = this.users.concat(this.data.items)
      console.log("users", this.users)

      //to check request limit, but never used.
      //checking 403 response status for "request over limit" is faster
      this.rateLimit = +this.header['x-ratelimit-limit']
      this.remainingRate = +this.header['x-ratelimit-remaining']

      let link = this.header.link
      try {
        var parts = link.split(',');
        var links = {};
        // Parse each part into a named link, finding the "next url" if any
        parts.forEach(p => {
          var section = p.split(';');
          if (section.length != 2) {
            throw new Error("section could not be split on ';'");
          }
          var url = section[0].replace(/<(.*)>/, '$1').trim();
          var name = section[1].replace(/rel="(.*)"/, '$1').trim();
          links[name] = url;
        });
        this.nextUrl = links['next']
      } catch (error) {
        this.nextUrl = ""
        console.log("next url not found", error)
      }
      //for debugging purpose
      console.log(this.data)
      console.log(this.header)
      console.log(this.nextUrl)
      console.log(this.remainingRate)
      console.log(this.rateLimit)

    }, (reject) => {
      console.log("reject error", reject)
      //will get 403 response status if we reach "request limit"
      if(reject.status == 403) {
        this.isLimitReached = true
      } else {
        this.isNoInternet = true
      }
      this.users = []
      this.loading.dismiss()
    }).catch((error) => {
      console.log("catch error", error)
      //will catch any network problem
      //including but not limited to "request time out, device offline, host not found, etc"
      this.users = []
      this.isNoInternet = true
      this.loading.dismiss()
    })
  }

  //callback for endless scrolling event
  //will fetch another batch of users if we got "next url" from previous response
  loadData(ev:any) {
    this.fetchData(this.query, this.nextUrl)
    ev.target.complete();
    if (!this.nextUrl){
      ev.target.disabled = true;
    }
  }

  async presentLoading() {
    this.loading = await this.loadingCtrl.create()
    console.log("present loading", this.loading)
    return await this.loading.present()
  }

  async dismissLoading() {
    console.log("dismiss loading")
    return await this.loadingCtrl.dismiss();
  }

  //callback for searchBar input  - onChange event
  //getting query from input, calling request to server
  search(ev) {
    //while user is typing, it'll set timeOut to call httpRequest multiple times.
    //we have to cancel previous timeout, get new typed query, and then set a new timeout later.
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
    console.log("search", ev)
    this.query = ev.target.value
    //to prevent calling httpRequest multiple times during typing the query.
    //user might have slow typing ability, so we have to wait for 1 second,
    //before processing typed query automatically. User don't have to press
    //any button or hit enter.
    this.searchTimeout = setTimeout(() => {
      //hide the keyboard
      this.renderer.invokeElementMethod(ev.target, 'blur');
      this.users = []
      this.nextUrl = ""
      if (this.query) {
        this.fetchData(this.query)
      }
    }, 1000)
  }

}

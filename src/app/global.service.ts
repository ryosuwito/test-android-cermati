import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  ep = 'https://api.github.com/search/users'

  constructor(public http: HTTP) { }

  httpRequest(query,nextUrl?) {
    console.log("using global httpRequest")
    console.log('_url', this.ep);
    let param
    let header = {
      "Content-Type" : "application/json",

    }
    let url
    
    if(nextUrl){
      param = {}
      url = nextUrl
    }else{
      url = this.ep
      param = {
        q : query
      }
    }
    console.log(param)
    console.log(header)

    return new Promise((resolve, reject) => {
      this.http.setDataSerializer("json");
      this.http.setRequestTimeout(5)
      this.http.get(url, param, header).then((res:any) => {
        console.log(res)
        let response: any = JSON.parse(res.data);
        let resHeader: any = res.headers
        if ((response.total_count != 0)) {
          console.log('resolve');
          resolve({data:response, header:resHeader});
        } else if (response.total_count == 0) {
          console.log('reject');
          resolve({data:response, header:resHeader});
        }
      }, (err) => {
        console.log("service error", err)
        reject(err);
      });
    })
  }
}

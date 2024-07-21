import { SERVER_IP } from "@env"
import { storageAuthTokenGet } from "@storage/storageAuthToken"
import { AppError } from "@utils/AppError"
import axios, { AxiosError, AxiosInstance } from "axios"

type SignOut = () => void

type APIInstanceProps = AxiosInstance & {
  registerInterceptTokenManager: (signOut: SignOut) => () => void
}

type PromisseType = {
  onSuccess: (token: string) => void
  onFailure: (error: AxiosError) => void
}

const api = axios.create({
  baseURL: `${SERVER_IP}`,
}) as APIInstanceProps

let failedQueue: Array<PromisseType> = []
let isRefreshing = false

api.registerInterceptTokenManager = (signOut) => {
  const interceptTokenManager = api.interceptors.response.use(
    (response) => response,
    async (requestError) => {
      if (requestError?.response?.status === 401) {
        if (
          requestError.response.data?.message === "token.expired" ||
          requestError.response.data?.message === "token.invalid"
        ) {
          const { refresh_token } = await storageAuthTokenGet()

          if (!refresh_token) {
            signOut()
            return Promise.reject(requestError)
          }

          const originalRequestConfig = requestError.config

          if(isRefreshing){}
        }

        signOut()
      }

      if (requestError.response && requestError.response.data) {
        return Promise.reject(new AppError(requestError.response.data.message))
      } else {
        return Promise.reject(requestError)
      }
    }
  )

  return () => {
    api.interceptors.response.eject(interceptTokenManager)
  }
}

export { api }

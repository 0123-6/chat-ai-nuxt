interface IProjectConfig {
  // 项目的名称,用来唯一标识此项目,小写加中划线,因为可能出现在url,所以不可以使用大写
  projectName: string,
  // 项目部署的路径,默认为'/',如果为非根路径,则为对应的非根路径,以'/'开头,以'/'结尾
  baseUrl: string,
  // 是否使用CDN?公网项目可用,内网项目不可用
  isUseCdn: boolean,
  // api请求公共前缀
  apiPrefix: Record<string, string>,
  // fetch默认请求方法
  fetchDefaultMethod: 'get' | 'post',
  // fetch的后端接口统一约定
  fetchApiResponseCodeMap: {
    success: (number | string)[],
    notLogin: (number | string)[],
  },
  // 登录使用路由还是直接修改url
  loginMode?: 'router' | 'url',
  // 路由路径
  loginRoutePath?: string,
  // 登录页面网址
  loginUrl?: string,
  // 是否有自己的菜单和最外层布局
  isShowMenu?: boolean,
  // 全局错误停留时间,不配置默认3s
  errorMessageDuration?: number,
}

// 项目的配置文件
export const projectConfig: IProjectConfig = {
  projectName: 'nuxt-project',
  baseUrl: '/vue/',
  isUseCdn: true,
  apiPrefix: {
    DEFAULT: '/api/',
  },
  fetchDefaultMethod: 'post',
  fetchApiResponseCodeMap: {
    'success': [200, '200'],
    'notLogin': [901, '901'],
  },
  loginMode: 'router',
  loginRoutePath: '/auth/login',
  isShowMenu: true,
}
